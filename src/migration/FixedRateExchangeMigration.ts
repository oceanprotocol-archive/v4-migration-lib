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

  // public async estGasGetAssetURL() {}

  public async getAssetURL(
    web3: Web3,
    accountId,
    did: string,
    providerUri: string,
    serviceId
  ) {
    const provider = await ProviderInstance
    const signature = provider.createSignature(web3, accountId, did + nonce)
    const providerEndpoints = await provider.getEndpoints(providerUri)
    const serviceEndpoints = await provider.getServiceEndpoints(
      providerUri,
      providerEndpoints
    )
    const path = provider.getEndpointURL(serviceEndpoints, 'encrypt')
      ? provider.getEndpointURL(serviceEndpoints, 'encrypt').urlPath
      : null

    if (!path) return null
    const nonce = provider.getNonce(providerUri, accountId)
    const data = {
      documentId: did,
      signature: signature,
      serviceId: serviceId,
      nonce: nonce,
      publisherAddress: accountId
    }

    try {
      const response = await fetch(path, {
        method: 'GET',
        body: decodeURI(JSON.stringify(data)),
        headers: {
          'Content-Type': 'application/octet-stream'
        }
      })
      return await response.text()
    } catch (e) {
      console.error(e)
      throw new Error('HTTP request failed')
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
    dtSymbol: string,
    contractInstance?: Contract
  ): Promise<any> {
    // const v3DDO = await getDDO(did)
    const ERC721FactoryContract = new this.web3.eth.Contract(
      ERC721Factory.abi as AbiItem[],
      ERC721FactoryAddress
    )
    // console.log('ERC721FactoryContract.methods', ERC721FactoryContract.methods)
    const gasLimitDefault = this.GASLIMIT_DEFAULT
    let estGas
    try {
      estGas = await ERC721FactoryContract.methods
        .createNftWithErc20WithFixedRate(
          {
            name: nftName,
            symbol: nftSymbol,
            templateIndex,
            tokenURI: 'https://oceanprotocol.com/TEST/'
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
    dtSymbol: string,
    contractInstance?: Contract
  ): Promise<TransactionReceipt> {
    // const v3DDO = await getDDO(did)
    const ERC721FactoryContract = new this.web3.eth.Contract(
      ERC721Factory.abi as AbiItem[],
      ERC721FactoryAddress
    )
    // console.log('ERC721FactoryContract.methods', ERC721FactoryContract.methods)
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
            tokenURI: 'https://oceanprotocol.com/TEST/'
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
    const tx = await tokenERC721.methods
      .setMetaData(
        metaDataState,
        metaDataDecryptorUrl,
        metaDataDecryptorAddress,
        flags,
        data,
        dataHash,
        metadataProofs
      )
      .send({
        from: ownerAddress,
        gas: estGas + 1,
        gasPrice: await getFairGasPrice(this.web3)
      })
    return tx
  }

  public async migrateFixedRateAsset(
    did: string,
    ERC721FactoryAddress: string,
    nftName: string,
    nftSymbol: string,
    ownerAddress: string,
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
    templateIndex,
    dtName,
    dtSymbol,
    metadataProofs?: MetadataProof[],
    contractInstance?: Contract
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
    const ddo = await getAndConvertDDO(
      did,
      nftAddress,
      erc20Address,
      metadataCacheUri
    )
    const provider = await ProviderInstance
    const encryptedDdo = await provider.encrypt(ddo, providerUrl)
    const dataHash = '0x' + sha256(JSON.stringify(ddo)).toString()

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
        dataHash
      )
    } catch (e) {
      console.log('Error', e)
    }
    return { txReceipt, txReceipt2 }
  }
}
