import { DDO as v3DDO } from '@oceanprotocol/lib'
import { DDO as v4DDO } from '../@types/DDO/DDO'
import { getDDO } from './importDDO'

export async function convertDDO(
  did: string,
  v3DDO: v3DDO,
  nftAddress: string,
  erc20Address: string
): Promise<v4DDO> {
  const publishedDate = new Date(Date.now()).toISOString().split('.')[0] + 'Z'
  // TODO: complete with nft erc20etc
  const v4DDO: v4DDO = {
    '@context': ['https://w3id.org/did/v1'],
    id: did,
    version: '4.0.0',
    chainId: v3DDO.chainId,
    nftAddress: nftAddress,
    metadata: {
      created: publishedDate,
      updated: publishedDate,
      type: v3DDO.service[0].attributes.main.type,
      name: v3DDO.service[0].attributes.main.name,
      description:
        v3DDO.service[0].attributes.additionalInformation.description,
      tags: v3DDO.service[0].attributes.additionalInformation.tags,
      links: v3DDO.service[0].attributes.additionalInformation.links,
      author: v3DDO.service[0].attributes.main.author,
      license: v3DDO.service[0].attributes.main.license,
      additionalInformation: {
        termsAndConditions:
          v3DDO.service[0].attributes.additionalInformation.termsAndConditions
      }
    },
    services: [
      {
        id: did,
        type: v3DDO.service[0].attributes.main.type,
        files: '',
        datatokenAddress: erc20Address,
        serviceEndpoint: v3DDO.service[1].serviceEndpoint,
        timeout: v3DDO.service[1].attributes.main.timeout
      }
    ]
  }

  return v4DDO
}

export async function getAndConvertDDO(
  did: string,
  nftAddress: string,
  erc20Address: string,
  metadataCacheUri: string
): Promise<v4DDO> {
  const v3DDO: v3DDO = await getDDO(did, metadataCacheUri)

  const v4DDO: v4DDO = await convertDDO(did, v3DDO, nftAddress, erc20Address)

  return v4DDO
}
