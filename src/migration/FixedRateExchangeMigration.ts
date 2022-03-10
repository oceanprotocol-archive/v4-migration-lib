import Web3 from 'web3'
// import { getAndConvertDDO } from '../DDO/convertDDO'
// import { getDDO } from '../DDO/importDDO'
import { Contract } from 'web3-eth-contract'
import { TransactionReceipt } from 'web3-eth'
import { AbiItem } from 'web3-utils'
import ERC721Factory from '../artifacts/ERC721Factory.json'

export class Migration {
  public GASLIMIT_DEFAULT = 1000000
  public web3: Web3
  public startBlock: number

  constructor(web3: Web3, startBlock?: number) {
    this.web3 = web3
    this.startBlock = startBlock || 0
  }

  public async migratedFixedRateAsset(
    did: string,
    ERC721FactoryAddress: string,
    nftName: string,
    nftSymbol: string,
    ownerAddress: string,
    cap: number,
    rate: number,
    marketFee: number,
    publishingMarketFeeAddress: string,
    publishingMarketTokenAddress: string,
    fixedRateExchangeAddress: string,
    baseTokenAddress: string,
    contractInstance?: Contract
  ): Promise<TransactionReceipt> {
    // const v3DDO = await getDDO(did)
    const ERC721FactoryContract = new this.web3.eth.Contract(
      ERC721Factory.abi as AbiItem[],
      ERC721FactoryAddress
    )
    // console.log('ERC721FactoryContract.methods', ERC721FactoryContract.methods)

    const tx =
      await ERC721FactoryContract.methods.createNftWithErc20WithFixedRate(
        {
          name: nftName,
          symbol: nftSymbol,
          templateIndex: 1,
          tokenURI: 'https://oceanprotocol.com/TEST/'
        },
        {
          strings: ['ERC20WithPool', 'ERC20P'],
          templateIndex: 1,
          addresses: [
            ownerAddress,
            ownerAddress,
            publishingMarketFeeAddress,
            publishingMarketTokenAddress
          ],
          uints: [cap, 0],
          bytess: []
        },
        {
          fixedPriceAddress: fixedRateExchangeAddress,
          addresses: [
            baseTokenAddress,
            ownerAddress,
            publishingMarketFeeAddress
          ],
          uints: [18, 18, rate, marketFee, 0]
        }
      )
    return tx
  }
}
