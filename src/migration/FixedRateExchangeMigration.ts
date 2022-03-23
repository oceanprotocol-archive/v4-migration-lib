import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'
import { TransactionReceipt } from 'web3-eth'
import { AbiItem } from 'web3-utils'
import ERC721Factory from '../artifacts/ERC721Factory.json'
import ERC721Template from '../artifacts/ERC721Template.json'
import { getFairGasPrice } from '../utils'
import { getAndConvertDDO } from '../DDO/convertDDO'
import ProviderInstance from '../provider/Provider'
import sha256 from 'crypto-js/sha256'
import { Ocean as V3Ocean } from '../../src/v3/ocean/Ocean'
import { ConfigHelper } from '../../src/v3/utils/ConfigHelper'
import { Account } from '../v3'
import { MetadataAndTokenURI, DDO as v4DDO } from '../@types'

export interface MetadataProof {
  validatorAddress?: string
  r?: string
  s?: string
  v?: number
}

export class Migration {
  public GASLIMIT_DEFAULT = 1000000
  public web3: Web3
  public startBlock: number

  constructor(web3: Web3, startBlock?: number) {
    this.web3 = web3
    this.startBlock = startBlock || 0
  }

  public async getHash(message: string): Promise<string> {
    let hex = ''
    for (let i = 0; i < message.length; i++) {
      hex += '' + message.charCodeAt(i).toString(16)
    }
    const hexMessage = '0x' + hex
    return hexMessage as string
  }

  public async getAssetURL(
    account: Account,
    did: string,
    network: string | number,
    infuraProjectId?: string
  ): Promise<string> {
    let urlResponse: string
    // Workaround for testing
    if (network === 'v4-testing') return 'http://oceanprotocol.com/test'
    try {
      const config = new ConfigHelper().getConfig(network, infuraProjectId)
      config.web3Provider = this.web3
      const ocean = await V3Ocean.getInstance(config)
      urlResponse = await ocean.provider.getAssetURL(account, did, 1)
    } catch (error) {
      console.log('error', error)
    }
    return urlResponse
  }

  public async getEncryptedFiles(
    providerUrl: string,
    account: Account,
    did: string,
    network: string | number
  ): Promise<string> {
    const assetURL = await this.getAssetURL(account, did, network)
    const file = [
      {
        type: 'url',
        url: assetURL,
        method: 'GET'
      }
    ]
    try {
      const response = await ProviderInstance.encrypt(file, providerUrl)
      return response
    } catch (error) {
      console.error('Error parsing json: ' + error.message)
    }
  }

  public async estGasPublishFixedRateAsset(
    did: string,
    ERC721FactoryAddress: string,
    nftName: string,
    nftSymbol: string,
    ownerAddress: string,
    cap: number,
    rate: string,
    marketFee: number,
    publishingMarketFeeAddress: string,
    publishingMarketTokenAddress: string,
    fixedRateExchangeAddress: string,
    baseTokenAddress: string,
    templateIndex: number,
    dtName: string,
    dtSymbol: string
  ): Promise<any> {
    // const v3DDO = await getDDO(did)
    const ERC721FactoryContract = new this.web3.eth.Contract(
      ERC721Factory.abi as AbiItem[],
      ERC721FactoryAddress
    )

    const gasLimitDefault = this.GASLIMIT_DEFAULT
    let estGas
    try {
      estGas = await ERC721FactoryContract.methods
        .createNftWithErc20WithFixedRate(
          {
            name: nftName,
            symbol: nftSymbol,
            templateIndex,
            tokenURI: ''
          },
          {
            strings: [dtName, dtSymbol],
            templateIndex,
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
              ownerAddress,
              publishingMarketFeeAddress
            ],
            uints: [18, 18, rate, marketFee, 0]
          }
        )
        .estimateGas({ from: ownerAddress }, (err, estGas) =>
          err ? gasLimitDefault : estGas
        )
    } catch (error) {
      console.log('error', error)
    }
    return estGas
  }

  public async publishFixedRateAsset(
    did: string,
    ERC721FactoryAddress: string,
    nftName: string,
    nftSymbol: string,
    ownerAddress: string,
    cap: number,
    rate: string,
    marketFee: number,
    publishingMarketFeeAddress: string,
    publishingMarketTokenAddress: string,
    fixedRateExchangeAddress: string,
    baseTokenAddress: string,
    templateIndex: number,
    dtName: string,
    dtSymbol: string
  ): Promise<TransactionReceipt> {
    // const v3DDO = await getDDO(did)
    const ERC721FactoryContract = new this.web3.eth.Contract(
      ERC721Factory.abi as AbiItem[],
      ERC721FactoryAddress
    )
    const estGas = await this.estGasPublishFixedRateAsset(
      did,
      ERC721FactoryAddress,
      nftName,
      nftSymbol,
      ownerAddress,
      cap,
      rate,
      marketFee,
      publishingMarketFeeAddress,
      publishingMarketTokenAddress,
      fixedRateExchangeAddress,
      baseTokenAddress,
      templateIndex,
      dtName,
      dtSymbol
    )
    let tx
    try {
      tx = await ERC721FactoryContract.methods
        .createNftWithErc20WithFixedRate(
          {
            name: nftName,
            symbol: nftSymbol,
            templateIndex,
            tokenURI: ''
          },
          {
            strings: [dtName, dtSymbol],
            templateIndex,
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
              ownerAddress,
              publishingMarketFeeAddress
            ],
            uints: [18, 18, rate, marketFee, 0]
          }
        )
        .send({
          from: ownerAddress,
          gas: estGas + 1,
          gasPrice: await getFairGasPrice(this.web3)
        })
    } catch (error) {
      console.log('error', error)
    }

    return tx
  }

  public async estGasUpdateMetadata(
    ownerAddress: string,
    txReceipt: any,
    metaDataState: number,
    metaDataDecryptorUrl: string,
    metaDataDecryptorAddress: string,
    flags: string,
    data: string,
    dataHash: string,
    metadataProofs?: MetadataProof[]
  ): Promise<any> {
    const gasLimitDefault = this.GASLIMIT_DEFAULT
    let estGas
    const event = txReceipt.events.NFTCreated
    const tokenAddress = event.returnValues.newTokenAddress
    if (!metadataProofs) metadataProofs = []

    const tokenERC721 = new this.web3.eth.Contract(
      ERC721Template.abi as AbiItem[],
      tokenAddress
    )
    try {
      estGas = await tokenERC721.methods
        .setMetaData(
          metaDataState,
          metaDataDecryptorUrl,
          metaDataDecryptorAddress,
          flags,
          data,
          dataHash,
          metadataProofs
        )
        .estimateGas({ from: ownerAddress }, (err, estGas) =>
          err ? gasLimitDefault : estGas
        )
    } catch (error) {
      console.log('error', error)
    }
    return estGas
  }

  public async updateMetadata(
    ownerAddress: string,
    txReceipt: any,
    metaDataState: number,
    metaDataDecryptorUrl: string,
    metaDataDecryptorAddress: string,
    flags: string,
    data: string,
    dataHash: string,
    asset: v4DDO,
    nftSymbol: string,
    marketURL: string,
    signal?: AbortSignal,
    metadataProofs?: MetadataProof[]
  ) {
    const event = txReceipt.events.NFTCreated
    const tokenAddress = event.returnValues.newTokenAddress
    if (!metadataProofs) metadataProofs = []

    const tokenERC721 = new this.web3.eth.Contract(
      ERC721Template.abi as AbiItem[],
      tokenAddress
    )
    const estGas = await this.estGasUpdateMetadata(
      ownerAddress,
      txReceipt,
      metaDataState,
      metaDataDecryptorUrl,
      metaDataDecryptorAddress,
      flags,
      data,
      dataHash,
      metadataProofs
    )

    // const tx = await tokenERC721.methods
    //   .setMetaData(
    //     metaDataState,
    //     metaDataDecryptorUrl,
    //     metaDataDecryptorAddress,
    //     flags,
    //     data,
    //     dataHash,
    //     metadataProofs
    //   )

    const encryptedDdo = await ProviderInstance.encrypt(
      asset,
      asset.services[0].serviceEndpoint,
      signal
    )

    const metadataHash = this.getHash(JSON.stringify(asset))
    const externalUrl = `${marketURL}/asset/${asset.id}`
    const encodedMetadata = Buffer.from(
      JSON.stringify({
        name: asset.metadata.name,
        symbol: nftSymbol,
        description: asset.metadata.description,
        external_url: externalUrl
      })
    ).toString('base64')

    const metadataAndTokenURI: MetadataAndTokenURI = {
      metaDataState: 0,
      metaDataDecryptorUrl,
      metaDataDecryptorAddress,
      flags,
      data: encryptedDdo,
      metaDataHash: '0x' + metadataHash,
      tokenId: 1,
      tokenURI: `data:application/json;base64,${encodedMetadata}`,
      metadataProofs: []
    }
    let tx
    try {
      tx = await tokenERC721.methods
        .setMetaDataAndTokenURI(metadataAndTokenURI)
        .send({
          from: ownerAddress,
          gas: estGas + 1,
          gasPrice: await getFairGasPrice(this.web3)
        })
    } catch (error) {
      console.log('setMetaDataAndTokenURI ERROR', error)
    }

    return tx
  }

  public async migrateFixedRateAsset(
    did: string,
    ERC721FactoryAddress: string,
    nftName: string,
    nftSymbol: string,
    ownerAddress: string,
    ownerAccount: Account,
    cap: number,
    rate: string,
    flags: string,
    marketFee: number,
    publishingMarketFeeAddress: string,
    publishingMarketTokenAddress: string,
    fixedRateExchangeAddress: string,
    baseTokenAddress: string,
    metaDataState: number,
    metaDataDecryptorAddress: string,
    providerUrl: string,
    metadataCacheUri: string,
    templateIndex: number,
    dtName: string,
    dtSymbol: string,
    network: string | number,
    marketURL: string,
    signal?: AbortSignal
  ) {
    let txReceipt
    try {
      txReceipt = await this.publishFixedRateAsset(
        did,
        ERC721FactoryAddress,
        nftName,
        nftSymbol,
        ownerAddress,
        cap,
        rate,
        marketFee,
        publishingMarketFeeAddress,
        publishingMarketTokenAddress,
        fixedRateExchangeAddress,
        baseTokenAddress,
        templateIndex,
        dtName,
        dtSymbol
      )
    } catch (e) {
      console.log('publishFixedRateAsset Error', e)
    }
    const nftAddress = txReceipt.events.NFTCreated.returnValues.newTokenAddress
    const erc20Address =
      txReceipt.events.TokenCreated.returnValues.newTokenAddress

    const encryptedFiles = await this.getEncryptedFiles(
      providerUrl,
      ownerAccount,
      did,
      network
    )
    console.log('encryptedFiles', encryptedFiles)
    const ddo = await getAndConvertDDO(
      did,
      nftAddress,
      erc20Address,
      metadataCacheUri,
      providerUrl,
      this.web3,
      ownerAccount,
      network,
      encryptedFiles
    )
    console.log('ddo', ddo)
    const provider = await ProviderInstance
    const encryptedDdo = await provider.encrypt(ddo, providerUrl)
    console.log('encryptedDdo', encryptedDdo)
    const dataHash = '0x' + sha256(JSON.stringify(ddo)).toString()
    console.log('dataHash', dataHash)

    let txReceipt2
    try {
      txReceipt2 = await this.updateMetadata(
        ownerAddress,
        txReceipt,
        metaDataState,
        providerUrl,
        metaDataDecryptorAddress,
        flags,
        encryptedDdo,
        dataHash,
        ddo,
        nftSymbol,
        marketURL,
        signal
      )
    } catch (e) {
      console.log('Error', e)
    }
    return { txReceipt, txReceipt2 }
  }
}
