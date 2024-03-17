import $ from 'jquery'
import numeral from 'numeral'
import { BigNumber } from 'bignumber.js'
import Web3 from 'web3'


const ORACLE_ABI = require('./abis/router.json').abi;
Window.Web3oo = Web3
Window.ABISS = ORACLE_ABI
const createWeb3 = (node) => {
  if (!node) return new Error('请检查节点');
  return new Web3(new Web3.providers.HttpProvider(node, 1000));
}



export function formatUsdValue(value) {
  const formattedValue = formatCurrencyValue(value)
  if (formattedValue === 'N/A') {
    return formattedValue
  } else {

    return `${formattedValue}`
    // return `${formattedValue} USD`
  }
}
function formatTokenUsdValue(value) {
  return formatCurrencyValue(value, '@')
}
function formatCurrencyValue(value, symbol) {
  symbol = symbol || '$'
  if (isNaN(value)) return 'N/A'
  if (value === 0 || value === '0') return `${symbol}0.00`
  if (value < 0.000001) return `${window.localized['Less than']} ${symbol}0.000001`
  if (value < 1) return `${symbol}${numeral(value).format('0.000000')}`
  if (value < 100000) return `${symbol}${numeral(value).format('0,0.00')}`
  if (value > 1000000000000) return `${symbol}${numeral(value).format('0.000e+0')}`
  return `${symbol}${numeral(value).format('0,0')}`

}

function weiToEther(wei) {
  return new BigNumber(wei).dividedBy('1000000000000000000').toNumber()
}

function etherToUSD(ether, usdExchangeRate) {
  return new BigNumber(ether).multipliedBy(usdExchangeRate).toNumber()
}

export function formatAllUsdValues(root) {
  root = root || $(':root')

  root.find('[data-usd-value]').each((i, el) => {
    el.innerHTML = formatUsdValue(el.dataset.usdValue)
  })
  root.find('[data-token-usd-value]').each((i, el) => {
    el.innerHTML = formatTokenUsdValue(el.dataset.tokenUsdValue)
  })

  return root
}
formatAllUsdValues()

function tryUpdateCalculatedUsdValues(el, usdExchangeRate = el.dataset.usdExchangeRate) {

  // eslint-disable-next-line no-prototype-builtins
  if (!el.dataset.hasOwnProperty('weiValue')) return
  const ether = weiToEther(el.dataset.weiValue)
  const usd = etherToUSD(ether, usdExchangeRate)
  const formattedUsd = formatUsdValue(usd)
  if (formattedUsd !== el.innerHTML) {
    $(el).data('rawUsdValue', usd)
    el.innerHTML = formattedUsd
  }
}

function tryUpdateUnitPriceValues(el, usdUnitPrice = el.dataset.usdUnitPrice) {
  const formattedValue = formatCurrencyValue(usdUnitPrice)
  if (formattedValue !== el.innerHTML) el.innerHTML = formattedValue
}




export function updateAllCalculatedUsdValues(usdExchangeRate) {
  getPrice().then(res => {
    usdExchangeRate = res.price
    $('[data-usd-exchange-rate]').each((i, el) => tryUpdateCalculatedUsdValues(el, usdExchangeRate))
    $('[data-usd-unit-price]').each((i, el) => tryUpdateUnitPriceValues(el, usdExchangeRate))
  })

}


export function getPrice(tokenAddr, symbolStr) {
  // const web3 = createWeb3('http://192.168.1.11:8540');
  const web3 = createWeb3('https://aia-dataseed2.aiachain.org');
  const configPro = {
    ROUTER_CONTRACT_ADDRESS: "0x3320B7E625124910BFad5CaF9DC1767205D91286",
    WAIA_CONTRACT_ADDRESS: "0xEC4C225F734a614B6d6f61b5Ddf0ae96c8e85E32",
    USDT_CONTRACT_ADDRESS: "0x848cb1a9770830da575DfD246dF2d4e38c1D40ed",
    USDT_UNDERLYING_DECIMALS: 6
  }
  symbolStr = 'WAIA'
  /**
   * 测试链
   * */
  // const priceContractAddr = "0x5e81Ed11AdBf3dd2b2DEc6F834301DA03038F6F3"
  // const token = "0x975a0C3A02468e93a8354d95f8d5d1972b7e3CB6"

  /**
   * 正式链
   * */

  let amountIn = Web3.utils.numberToHex(100 * 1e18);
  let pair = [configPro.WAIA_CONTRACT_ADDRESS, configPro.USDT_CONTRACT_ADDRESS];

  return new Promise(function (resolve, reject) {
    const fn = async function () {
      symbolStr = symbolStr.toLocaleUpperCase()
      const ABI = ORACLE_ABI
      const router_contract = new web3.eth.Contract(ABI, configPro.ROUTER_CONTRACT_ADDRESS);
      try {

        /**
   * 测试链
   * */
        // price = await priceContract.methods.assetPrices(token).call()
        const txParams = {
          to: configPro.ROUTER_CONTRACT_ADDRESS,
          data: router_contract.methods.getAmountsOut(amountIn, pair).encodeABI()
        }
        let ret = await web3.eth.call(txParams, 'latest')
        if (ret.length > 100) {
          let price = ret.substr(ret.length - 64);
          let priceInt = parseInt(price, 16) * Math.pow(10, 18 - configPro.USDT_UNDERLYING_DECIMALS) / 100;
          // let priceList = coinList.get('WAIA');
          // priceList.push(priceInt / 1e18);
          // console.info(price,priceInt)
          resolve({
            price: (priceInt / 1e18)
          })
        }

      } catch (error) {
        console.log('查询价格getPrice', error)
        reject({
          error: true
        })
      }
    }

    fn().then()
  })

}
const getValueByDecimals = function (value, decimals) {
  const BN = new BigNumber(value)
  const v = BN.div(Math.pow(10, decimals))

  return v
}
updateAllCalculatedUsdValues()
