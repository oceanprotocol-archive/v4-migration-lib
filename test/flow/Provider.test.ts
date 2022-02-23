import { Provider } from '../../src/provider/Provider'
import { assert } from 'chai'
import { FileMetadata, DDO } from '../../src/@types'
import { SHA256 } from 'crypto-js'
import { getHash } from '../../src/utils'
import Web3 from 'web3'
const web3 = new Web3('http://127.0.0.1:8545')
const files = [
  {
    type: 'url',
    url: 'https://raw.githubusercontent.com/oceanprotocol/testdatasets/main/shs_dataset_test.txt',
    method: 'GET'
  }
]
const genericAsset: DDO = {
  '@context': ['https://w3id.org/did/v1'],
  id: 'testFakeDid',
  version: '4.0.0',
  chainId: 4,
  nftAddress: '0x0',
  metadata: {
    created: '2021-12-20T14:35:20Z',
    updated: '2021-12-20T14:35:20Z',
    name: 'dataset-name',
    type: 'dataset',
    description: 'Ocean protocol test dataset description',
    author: 'oceanprotocol-team',
    license: 'MIT',
    tags: ['white-papers'],
    additionalInformation: { 'test-key': 'test-value' },
    links: ['http://data.ceda.ac.uk/badc/ukcp09/']
  },
  services: [
    {
      id: 'testFakeId',
      type: 'access',
      description: 'Download service',
      files: '',
      datatokenAddress: '0xa15024b732A8f2146423D14209eFd074e61964F3',
      serviceEndpoint: 'https://providerv4.rinkeby.oceanprotocol.com',
      timeout: '0'
    }
  ]
}
const providerUrl = 'http://127.0.0.1:8030'
const sampleNFTAddress = '0xa15024b732A8f2146423D14209eFd074e61964F3'
const sampleDTAddress = '0xa15024b732A8f2146423D14209eFd074e61964F3'
describe('Provider tests', () => {
  let providerInstance: Provider

  it('Initialize Ocean', async () => {
    providerInstance = new Provider()
  })

  it('Alice tests invalid provider', async () => {
    const valid = await providerInstance.isValidProvider('http://example.net')
    assert(valid === false)
  })

  it('Alice tests valid provider', async () => {
    const valid = await providerInstance.isValidProvider(providerUrl)
    assert(valid === true)
  })

  it('Alice checks fileinfo', async () => {
    const fileinfo: FileMetadata[] = await providerInstance.checkFileUrl(
      'https://dumps.wikimedia.org/enwiki/latest/enwiki-latest-abstract.xml.gz-rss.xml',
      'http://127.0.0.1:8030'
    )
    assert(fileinfo[0].valid === true, 'Sent file is not valid')
  })

  it('Alice encrypts files and sign message', async () => {
    const encryptedFiles = await providerInstance.encrypt(files, providerUrl)
    console.log(encryptedFiles)
    const poolDdo: DDO = { ...genericAsset }
    poolDdo.metadata.name = 'test-dataset-pool'
    poolDdo.services[0].files = encryptedFiles
    poolDdo.services[0].datatokenAddress = sampleDTAddress

    poolDdo.nftAddress = sampleNFTAddress
    const chain = await web3.eth.getChainId()
    poolDdo.chainId = chain
    poolDdo.id =
      'did:op:' +
      SHA256(
        web3.utils.toChecksumAddress(sampleNFTAddress) + chain.toString(10)
      )

    // const AssetValidation: ValidateMetadata = await aquarius.validate(poolDdo)
    // assert(AssetValidation.valid === true, 'Published asset is not valid')

    const encryptedDdo = await providerInstance.encrypt(poolDdo, providerUrl)

    const metadataHash = getHash(JSON.stringify(poolDdo))

    // assert(AssetValidation.hash === '0x' + metadataHash, 'Metadata hash is a missmatch')
    console.log(encryptedDdo, 'encryptedDDO boom')
    console.log(metadataHash, 'metadataHash boom')

    // const resolvedDDO = await aquarius.waitForAqua(poolDdo.id)
    // assert(resolvedDDO, 'Cannot fetch DDO from Aquarius')
  })
})
