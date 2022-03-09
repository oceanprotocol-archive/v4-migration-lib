import { getAndConvertDDO } from '../DDO/convertDDO'
import { Contract } from 'web3-eth-contract'
import { TransactionReceipt } from 'web3-eth'
import { AbiItem } from 'web3-utils'
import ERC721Template from '../artifacts/ERC721Template.json'
import ERC20Template from '../artifacts/ERC20Template.json'
import ERC721Factory from '../artifacts/ERC721Factory.json'

export async function migratedFixedRateAsset(
  did: string,
  ERC721TemplateAddress: string,
  contractInstance?: Contract
): Promise<TransactionReceipt> {
  const v4DDO = await getAndConvertDDO(did)
  const ERC721TemplateContract =
    contractInstance ||
    new this.web3.eth.Contract(
      ERC721Template.abi as AbiItem[],
      ERC721TemplateAddress
    )
  const tx = ERC721TemplateContract.createNftErcWithFixedRate(
    {
      name: '72120PBundle',
      symbol: '72PBundle',
      templateIndex: 1,
      tokenURI: 'https://oceanprotocol.com/nft/'
    },
    {
      strings: ['ERC20WithPool', 'ERC20P'],
      templateIndex: 1,
      addresses: [
        user3.address,
        user6.address,
        user3.address,
        '0x0000000000000000000000000000000000000000'
      ],
      uints: [cap, 0],
      bytess: []
    },
    {
      fixedPriceAddress: fixedRateExchange.address,
      addresses: [
        erc20TokenWithPublishFee.address,
        user3.address,
        user6.address,
        ZERO_ADDRESS
      ],
      uints: [18, 18, rate, marketFee, 0]
    }
  )
  const txReceipt = await tx.wait()
  return txReceipt
}
