import getContract from '../utils/getContract'
import web3 from '../utils/getWeb3'
import ERC721Factory from '../../artifacts/contracts/ERC721Factory.sol/ERC721Factory.json'
import { getDDO } from '../DDO/importDDO'

export async function publishNFT(did: string, url: string): Promise<any> {
  const ddo = await getDDO(did)
  const erc721Factory = await getContract(web3, ERC721Factory)
  const tx = await erc721Factory.deployERC721Contract(
    ddo.dataTokenInfo.name,
    ddo.dataTokenInfo.symbol,
    1,
    '0x0000000000000000000000000000000000000000',
    url
  )
  const txReceipt = await tx.wait()
  return txReceipt
}
