import axios, { AxiosResponse } from 'axios'
import { SHA256 } from 'crypto-js'
import sha256 from 'crypto-js/sha256'
import Web3 from 'web3'
import { TransactionReceipt } from 'web3-eth'
import { Contract } from 'web3-eth-contract'
import { AbiItem } from 'web3-utils'
import { DDO as v4DDO } from '../@types/DDO/DDO'
import DataTokenTemplate from '../artifacts/DataTokenTemplate.json'
import IERC20 from '../artifacts/IERC20.json'
import { convertDDO } from '../DDO/convertDDO'
import { DDO, DDO as v3DDO } from '../DDO/ddoV3/DDO'
import { getDDO } from '../DDO/importDDO'
import { Provider, ServiceEndpoint } from '../provider'
import { getFairGasPrice } from '../utils'
import ERC721Template from './../../src/artifacts/ERC721Template.json'
import { abi as Erc721TemplateAbi } from './../artifacts/ERC721Template.json'
import { abi as MigrationAbi } from './../artifacts/V4Migration.json'

/**
 * Pool Info
 */
export interface PoolStatus {
  status: string
  poolV3Address: string
  poolV4Address: string
  didV3: string
  didV4: string
  owner: string
  poolShareOwners: string[]
  dtV3Address: string
  totalOcean: string
  totalDTBurnt: string
  newLPTAmount: string
  lptRounding: string
  deadline: string
}

export interface MetadataProof {
  validatorAddress?: string
  r?: string
  s?: string
  v?: number
}

/**
 * Tokens Details
 */
export interface TokensDetails {
  erc721Address: string
  dtV4Address: string
  nftName: string
  nftSymbol: string
  tokenURI: string
  erc20Name: string
  erc20Symbol: string
}

/**
 * User's shares allocation
 */
export interface ShareAllocation {
  userV3Shares: string
  userV4Shares: string
  alreadyAdded: boolean
}

export class Migration {
  public GASLIMIT_DEFAULT = 1000000
  public factory721Address: string
  public factory721Abi: AbiItem | AbiItem[]
  public migrationAbi: AbiItem | AbiItem[]
  public web3: Web3
  public startBlock: number

  constructor(
    web3: Web3,
    migrationAbi?: AbiItem | AbiItem[],
    startBlock?: number
  ) {
    this.migrationAbi = migrationAbi || (MigrationAbi as AbiItem[])
    this.web3 = web3
    this.startBlock = startBlock || 0
  }

  /**
   * Estimate gas cost for approve method
   * @param {String} address User address
   * @param {String} erc20Address erc20 address
   * @param {String} spender Spender address
   * @param {string} amount Number of tokens, in ether units. Will be converted to wei
   * @param {Contract} contractInstance optional contract instance
   * @return {Promise<any>}
   */
  public async estGasApprove(
    address: string,
    erc20Address: string,
    spender: string,
    amount: string,
    contractInstance?: Contract
  ): Promise<any> {
    const erc20Contract =
      contractInstance ||
      new this.web3.eth.Contract(IERC20.abi as AbiItem[], erc20Address)

    // Estimate gas cost for mint method
    const gasLimitDefault = this.GASLIMIT_DEFAULT
    let estGas
    try {
      estGas = await erc20Contract.methods
        .approve(spender, this.web3.utils.toWei(amount))
        .estimateGas({ from: address }, (err, estGas) =>
          err ? gasLimitDefault : estGas
        )
    } catch (e) {
      estGas = gasLimitDefault
    }
    return estGas
  }

  /**
   * Approve
   * @param {String} address User address
   * @param {String} erc20Address erc20 address
   * @param {String} spender Spender address
   * @param {string} amount Number of tokens, in ether units. Will be converted to wei
   * @param {Contract} contractInstance optional contract instance
   * @return {Promise<TransactionReceipt>} trxReceipt
   */
  public async approve(
    address: string,
    erc20Address: string,
    spender: string,
    amount: string,
    contractInstance?: Contract
  ): Promise<TransactionReceipt> {
    const erc20Contract =
      contractInstance ||
      new this.web3.eth.Contract(IERC20.abi as AbiItem[], erc20Address)

    const estGas = await this.estGasApprove(
      address,
      erc20Address,
      spender,
      amount,
      erc20Contract
    )

    const trxReceipt = await erc20Contract.methods
      .approve(spender, this.web3.utils.toWei(amount))
      .send({
        from: address,
        gas: estGas + 1,
        gasPrice: await getFairGasPrice(this.web3)
      })
    return trxReceipt
  }

  /** Get NFT Factory Address
   * @param {String} migrationAddress migration contract address
   * @param {Contract} migrationContract optional contract instance
   * @return {Promise<string>} factory address
   */
  public async getNftFactory(
    migrationAddress: string,
    contractInstance?: Contract
  ): Promise<string> {
    const migrationContract =
      contractInstance ||
      new this.web3.eth.Contract(this.migrationAbi, migrationAddress)
    const address = await migrationContract.methods
      .ERC721FactoryAddress()
      .call()
    return address
  }

  /** Get Migration Owner
   * @param {String} migrationAddress migration contract address
   * @param {Contract} migrationContract optional contract instance
   * @return {Promise<string>} factory address
   */
  public async getOwner(
    migrationAddress: string,
    contractInstance?: Contract
  ): Promise<string> {
    const migrationContract =
      contractInstance ||
      new this.web3.eth.Contract(this.migrationAbi, migrationAddress)
    return await migrationContract.methods.owner().call()
  }

  /** Get Ocean Address
   * @param {String} migrationAddress migration contract address
   * @param {Contract} migrationContract optional contract instance
   * @return {Promise<string>} Ocean address
   */
  public async getOcean(
    migrationAddress: string,
    contractInstance?: Contract
  ): Promise<string> {
    const migrationContract =
      contractInstance ||
      new this.web3.eth.Contract(this.migrationAbi, migrationAddress)
    const address = await migrationContract.methods.oceanAddress().call()
    return address
  }

  /** Get Pool Template address
   * @param {String} migrationAddress migration contract address
   * @param {Contract} migrationContract optional contract instance
   * @return {Promise<string>} Pool Template address
   */
  public async getPoolTemplate(
    migrationAddress: string,
    contractInstance?: Contract
  ): Promise<string> {
    const migrationContract =
      contractInstance ||
      new this.web3.eth.Contract(this.migrationAbi, migrationAddress)
    const address = await migrationContract.methods.poolTemplate().call()
    return address
  }

  /** Get Pool Template address
   * @param {String} migrationAddress migration contract address
   * @param {Contract} migrationContract optional contract instance
   * @return {Promise<string>} Pool Template address
   */
  public async getDaemon(
    migrationAddress: string,
    contractInstance?: Contract
  ): Promise<string> {
    const migrationContract =
      contractInstance ||
      new this.web3.eth.Contract(this.migrationAbi, migrationAddress)
    const address = await migrationContract.methods.daemon().call()
    return address
  }

  /**
   *  Estimate gas cost for startMigration
 
   * @param {String} address User address
   * @param {String} migrationAddress Migration address
   * @param {String} v3DtAddress v3 datatoken address
   * @param {String} poolAddressV3 v3 pool address
   * @param {String} didV3 v3 did
   * @param {String} tokenURI tokenURI for NFT Metadata (for opensea etc)
   * @param {String[]} nftNameAndSymbol NFT name and symbol [NAME, SYMBOL]
   * @param {String[]} erc20NameAndSymbol new v4 Dt name and symbol [NAME, SYMBOL]
   * @param {Contract} migrationContract optional contract instance
   * @return {Promise<any>}
   */
  public async estGasStartMigration(
    address: string,
    migrationAddress: string,
    v3DtAddress: string,
    poolAddressV3: string,
    didV3: string,
    tokenURI: string,
    nftNameAndSymbol: string[],
    erc20NameAndSymbol: string[],
    contractInstance?: Contract
  ): Promise<any> {
    const migrationContract =
      contractInstance ||
      new this.web3.eth.Contract(this.migrationAbi, migrationAddress)

    const gasLimitDefault = this.GASLIMIT_DEFAULT
    let estGas
    try {
      estGas = await migrationContract.methods
        .startMigration(
          v3DtAddress,
          poolAddressV3,
          didV3,
          tokenURI,
          nftNameAndSymbol,
          erc20NameAndSymbol
        )
        .estimateGas({ from: address }, (err, estGas) =>
          err ? gasLimitDefault : estGas
        )
    } catch (e) {
      estGas = gasLimitDefault
    }
    return estGas
  }

  /**
   * Start window for V3 to V4 migration. Only v3 dt owner can call it
   * @param {String} address User address
   * @param {String} migrationAddress Migration address
   * @param {String} v3DtAddress v3 datatoken address
   * @param {String} poolAddressV3 v3 pool address
   * @param {String} didV3 v3 did
   * @param {String} tokenURI tokenURI for NFT Metadata (for opensea etc)
   * @param {String[]} nftNameAndSymbol NFT name and symbol [NAME, SYMBOL]
   * @param {String[]} erc20NameAndSymbol new v4 Dt name and symbol [NAME, SYMBOL]
   * @param {Contract} migrationContract optional contract instance
   * @return {Promise<TransactionReceipt>} Trx Receipt
   */
  public async startMigration(
    address: string,
    migrationAddress: string,
    v3DtAddress: string,
    poolAddressV3: string,
    didV3: string,
    tokenURI: string,
    nftNameAndSymbol: string[],
    erc20NameAndSymbol: string[],
    contractInstance?: Contract
  ): Promise<TransactionReceipt> {
    const v3DtContract =
      contractInstance ||
      new this.web3.eth.Contract(
        DataTokenTemplate.abi as AbiItem[],
        v3DtAddress
      )

    if (!(await v3DtContract.methods.isMinter(address).call())) {
      throw new Error(`Caller is not V3Dt Owner`)
    }
    if (
      (await this.getPoolStatus(migrationAddress, poolAddressV3)).status !== '0'
    ) {
      throw new Error(`Migration process has already been started`)
    }
    // Create migration object
    const migrationContract =
      contractInstance ||
      new this.web3.eth.Contract(this.migrationAbi, migrationAddress)

    const estGas = await this.estGasStartMigration(
      address,
      migrationAddress,
      v3DtAddress,
      poolAddressV3,
      didV3,
      tokenURI,
      nftNameAndSymbol,
      erc20NameAndSymbol,
      migrationContract
    )

    const trxReceipt = await migrationContract.methods
      .startMigration(
        v3DtAddress,
        poolAddressV3,
        didV3,
        tokenURI,
        nftNameAndSymbol,
        erc20NameAndSymbol
      )
      .send({
        from: address,
        gas: estGas + 1,
        gasPrice: await getFairGasPrice(this.web3)
      })

    return trxReceipt
  }

  /**
   *  Estimate gas cost for addShares
 
   * @param {String} address user address
   * @param {String} migrationAddress migration address
   * @param {String} poolAddressV3 v3 pool address
   * @param {String} lptV3Amount v3 LPT Amount to add for migration
   * @param {Contract} migrationContract optional contract instance
   * @return {Promise<any>}
   */
  public async estGasAddShares(
    address: string,
    migrationAddress: string,
    poolAddressV3: string,
    lptV3Amount: string,
    contractInstance?: Contract
  ): Promise<any> {
    const migrationContract =
      contractInstance ||
      new this.web3.eth.Contract(this.migrationAbi, migrationAddress)

    const gasLimitDefault = this.GASLIMIT_DEFAULT
    let estGas
    try {
      estGas = await migrationContract.methods
        .addShares(poolAddressV3, lptV3Amount)
        .estimateGas({ from: address }, (err, estGas) =>
          err ? gasLimitDefault : estGas
        )
    } catch (e) {
      estGas = gasLimitDefault
    }
    return estGas
  }

  // REQUIRES User to approve lptV3Amount to Migration contract
  /**
   * Add LPTs for migration, can be done only if deadline has not passed.
   * @param {String} address user address
   * @param {String} migrationAddress migration address
   * @param {String} poolAddressV3 v3 pool address
   * @param {String} lptV3Amount v3 LPT Amount to add for migration
   * @param {Contract} migrationContract optional contract instance
   * @return {Promise<Object>} Trx Receipt
   */
  public async addShares(
    address: string,
    migrationAddress: string,
    poolAddressV3: string,
    lptV3Amount: string,
    contractInstance?: Contract
  ): Promise<TransactionReceipt> {
    if (
      (await this.getPoolStatus(migrationAddress, poolAddressV3)).status !== '1'
    ) {
      throw new Error(`Adding shares is not currently allowed`)
    }
    if (
      (await this.getPoolStatus(migrationAddress, poolAddressV3)).deadline <
      (await this.web3.eth.getBlockNumber()).toString()
    ) {
      throw new Error(`Deadline reached for adding shares`)
    }
    const migrationContract =
      contractInstance ||
      new this.web3.eth.Contract(this.migrationAbi, migrationAddress)

    const estGas = await this.estGasAddShares(
      address,
      migrationAddress,
      poolAddressV3,
      lptV3Amount,
      migrationContract
    )

    const trxReceipt = await migrationContract.methods
      .addShares(poolAddressV3, lptV3Amount)
      .send({
        from: address,
        gas: estGas + 1,
        gasPrice: await getFairGasPrice(this.web3)
      })

    return trxReceipt
  }

  /**
   *  Estimate gas cost for removeShares
 
   * @param {String} address user address
   * @param {String} migrationAddress migration address
   * @param {String} poolAddressV3 v3 pool address
   * @param {String} lptV3Amount v3 LPT Amount to remove from migration
   * @param {Contract} migrationContract optional contract instance
   * @return {Promise<any>}
   */
  public async estGasRemoveShares(
    address: string,
    migrationAddress: string,
    poolAddressV3: string,
    lptV3Amount: string,
    contractInstance?: Contract
  ): Promise<any> {
    const migrationContract =
      contractInstance ||
      new this.web3.eth.Contract(this.migrationAbi, migrationAddress)

    const gasLimitDefault = this.GASLIMIT_DEFAULT
    let estGas
    try {
      estGas = await migrationContract.methods
        .removeShares(poolAddressV3, lptV3Amount)
        .estimateGas({ from: address }, (err, estGas) =>
          err ? gasLimitDefault : estGas
        )
    } catch (e) {
      estGas = gasLimitDefault
    }
    return estGas
  }

  /**
   * Remove shares for migration, can be done only BEFORE deadline OR if threshold is NOT met, AFTER deadline
   * @param {String} address user address
   * @param {String} migrationAddress migration address
   * @param {String} poolAddressV3 v3 pool address
   * @param {String} lptV3Amount v3 LPT Amount to remove from migration
   * @param {Contract} migrationContract optional contract instance
   * @return {Promise<Object>} Trx Receipt
   */
  public async removeShares(
    address: string,
    migrationAddress: string,
    poolAddressV3: string,
    lptV3Amount: string,
    contractInstance?: Contract
  ): Promise<TransactionReceipt> {
    if (
      (await this.getPoolStatus(migrationAddress, poolAddressV3)).status !== '1'
    ) {
      throw new Error(`Current pool status does not allow share removal`)
    }
    if (
      (await this.getPoolStatus(migrationAddress, poolAddressV3)).deadline <
      (await this.web3.eth.getBlockNumber()).toString()
    ) {
      throw new Error(`Deadline reached for removing shares`)
    }
    if (
      (await this.getShareAllocation(migrationAddress, poolAddressV3, address))
        .userV3Shares < lptV3Amount
    ) {
      throw new Error(`User does not have sufficient shares locked up`)
    }
    // Create migration object
    const migrationContract =
      contractInstance ||
      new this.web3.eth.Contract(this.migrationAbi, migrationAddress)

    const estGas = await this.estGasAddShares(
      address,
      migrationAddress,
      poolAddressV3,
      lptV3Amount,
      migrationContract
    )

    const trxReceipt = await migrationContract.methods
      .removeShares(poolAddressV3, lptV3Amount)
      .send({
        from: address,
        gas: estGas + 1,
        gasPrice: await getFairGasPrice(this.web3)
      })

    return trxReceipt
  }

  /** Check if threshold is MET or NOT
   * @param {String} migrationAddress migration contract address
   * @param {Contract} poolAddressV3 v3 pool to check
   * @param {Contract} migrationContract optional contract instance
   * @return {Promise<boolean>} True if met
   */
  public async thresholdMet(
    migrationAddress: string,
    poolAddressV3: string,
    contractInstance?: Contract
  ): Promise<boolean> {
    const migrationContract =
      contractInstance ||
      new this.web3.eth.Contract(this.migrationAbi, migrationAddress)
    const status = await migrationContract.methods
      .thresholdMet(poolAddressV3)
      .call()
    return status
  }

  /**
   *  Estimate gas cost for cancelMigration
 
   * @param {String} address user address
   * @param {String} migrationAddress migration address
   * @param {String} poolAddressV3 v3 pool address
   * @param {Contract} migrationContract optional contract instance
   * @return {Promise<any>}
   */
  public async estGasCancelMigration(
    address: string,
    migrationAddress: string,
    poolAddressV3: string,
    contractInstance?: Contract
  ): Promise<any> {
    const migrationContract =
      contractInstance ||
      new this.web3.eth.Contract(this.migrationAbi, migrationAddress)

    const gasLimitDefault = this.GASLIMIT_DEFAULT
    let estGas
    try {
      estGas = await migrationContract.methods
        .cancelMigration(poolAddressV3)
        .estimateGas({ from: address }, (err, estGas) =>
          err ? gasLimitDefault : estGas
        )
    } catch (e) {
      estGas = gasLimitDefault
    }
    return estGas
  }

  /**
   * Cancel a Migration, can be done ONLY if threshold not met, before or after deadline
   * @param {String} address user address
   * @param {String} migrationAddress migration address
   * @param {String} poolAddressV3 v3 pool address
   * @param {Contract} migrationContract optional contract instance
   * @return {Promise<TransactionReceipt>} Trx Receipt
   */
  public async cancelMigration(
    address: string,
    migrationAddress: string,
    poolAddressV3: string,
    contractInstance?: Contract
  ): Promise<string> {
    if (
      (await this.getPoolStatus(migrationAddress, poolAddressV3)).owner !==
        address ||
      (await this.getOwner(migrationAddress)) !== address
    ) {
      throw new Error(`Not OPF or DT owner`)
    }
    if (
      (await this.getPoolStatus(migrationAddress, poolAddressV3)).status !== '1'
    ) {
      throw new Error(`Current pool status does not allow to cancel Pool`)
    }
    if (await this.thresholdMet(migrationAddress, poolAddressV3)) {
      throw new Error(`Threshold already met`)
    }
    // Create migration object
    const migrationContract =
      contractInstance ||
      new this.web3.eth.Contract(this.migrationAbi, migrationAddress)

    const estGas = await this.estGasCancelMigration(
      address,
      migrationAddress,
      poolAddressV3,
      migrationContract
    )

    const trxReceipt = await migrationContract.methods
      .cancelMigration(poolAddressV3)
      .send({
        from: address,
        gas: estGas + 1,
        gasPrice: await getFairGasPrice(this.web3)
      })

    return trxReceipt
  }

  /**
   *  Estimate gas cost for liquidateAndCreatePool
 
   * @param {String} address user address
   * @param {String} migrationAddress migration address
   * @param {String} poolAddressV3 v3 pool address 
   * @param {String} minAmountsOut minimum amounts out for Ocean and v3 DT (redeem bpool inputs)
   * @param {Contract} migrationContract optional contract instance
   * @return {Promise<any>}
   */
  public async estGasLiquidateAndCreatePool(
    address: string,
    migrationAddress: string,
    poolAddressV3: string,
    minAmountsOut: string[],
    contractInstance?: Contract
  ): Promise<any> {
    const migrationContract =
      contractInstance ||
      new this.web3.eth.Contract(this.migrationAbi, migrationAddress)

    const gasLimitDefault = this.GASLIMIT_DEFAULT
    let estGas
    try {
      estGas = await migrationContract.methods
        .liquidateAndCreatePool(poolAddressV3, minAmountsOut)
        .estimateGas({ from: address }, (err, estGas) =>
          err ? gasLimitDefault : estGas
        )
    } catch (e) {
      estGas = gasLimitDefault
    }
    return estGas
  }

  /**
   * Redeem v3 LPTs and creates a new v4 dt, new v4 Pool and send v4 lpt to users with allocation
   * Can be called ONLY if threshold is MET and deadline has passed, by anyone
   * @param {String} address user address
   * @param {String} migrationAddress migration address
   * @param {String} poolAddressV3 v3 pool address
   * @param {Contract} migrationContract optional contract instance
   * @return {Promise<TransactionReceipt>} Trx Receipt
   */
  public async liquidateAndCreatePool(
    address: string,
    migrationAddress: string,
    poolAddressV3: string,
    minAmountsOut: string[],
    contractInstance?: Contract
  ): Promise<TransactionReceipt> {
    if (
      (await this.getPoolStatus(migrationAddress, poolAddressV3)).status !== '1'
    ) {
      throw new Error(`Current pool status does not allow to liquidate Pool`)
    }
    if (!(await this.thresholdMet(migrationAddress, poolAddressV3))) {
      throw new Error(`Threshold not met`)
    }
    if (
      (await this.getPoolStatus(migrationAddress, poolAddressV3)).deadline >
      (await this.web3.eth.getBlockNumber()).toString()
    ) {
      throw new Error(`Cannot be called before deadline`)
    }
    const migrationContract =
      contractInstance ||
      new this.web3.eth.Contract(this.migrationAbi, migrationAddress)
    // TODO: check tokens order in v3 pools creation and update properly
    const oceanInWei = this.web3.utils.toWei(minAmountsOut[0])
    const v3DtInWei = this.web3.utils.toWei(minAmountsOut[1])

    const estGas = await this.estGasLiquidateAndCreatePool(
      address,
      migrationAddress,
      poolAddressV3,
      [oceanInWei, v3DtInWei],
      migrationContract
    )

    const trxReceipt = await migrationContract.methods
      .liquidateAndCreatePool(poolAddressV3, [oceanInWei, v3DtInWei])
      .send({
        from: address,
        gas: estGas + 1,
        gasPrice: await getFairGasPrice(this.web3)
      })
    return trxReceipt
  }

  /**
   *  Estimate gas cost for setMetadataAndTransferNFT
 
   * @param {String} address User address
   * @param {String} migrationAddress V4Migration address
   * @param {String} poolAddress v4 pool
   * @param {String} metaDataState metaDataState(0,1,..)
   * @param {String} metaDataDecryptorUrlAndAddress metaDataState(0,1,..)
   * @param {String} bytes flags,data
   * @param {String} metaDataHash metaDataHash
   * @param {String} didV4 v4 did
   * @param {Contract} migrationContract optional contract instance
   * @return {Promise<any>}
   */
  public async estGasSetMetadataAndTransferNFT(
    address: string,
    migrationAddress: string,
    poolAddress: string,
    metaDataState: string,
    metaDataDecryptorUrlAndAddress: string[],
    flags: string,
    data: string,
    metaDataHash: string,
    didV4: string,
    metadataProof?: MetadataProof[],
    contractInstance?: Contract
  ): Promise<any> {
    const migrationContract =
      contractInstance ||
      new this.web3.eth.Contract(this.migrationAbi, migrationAddress)

    const gasLimitDefault = this.GASLIMIT_DEFAULT
    let estGas
    try {
      estGas = await migrationContract.methods
        .setMetadataAndTransferNFT(
          poolAddress,
          metaDataState,
          metaDataDecryptorUrlAndAddress,
          flags,
          data,
          metaDataHash,
          didV4,
          metadataProof || []
        )
        .estimateGas({ from: address }, (err, estGas) =>
          err ? gasLimitDefault : estGas
        )
    } catch (e) {
      estGas = gasLimitDefault
    }
    return estGas
  }

  /**
   * Set metadata and send NFT to old V3DtOwner (the one who opened the migration)
   * @param {String} nftAddress ERC721 addreess
   * @param {String} address User address
   * @param {String} migrationAddress V4Migration address
   * @param {String} poolAddress v4 pool
   * @param {String} metaDataState metaDataState(0,1,..)
   * @param {String[]} metaDataDecryptorUrlAndAddress metaDataState(0,1,..) [decryprtoUrl, decryptorAddress]
   * @param {String[]} bytes [flags,data]
   * @param {String} metaDataHash metaDataHash
   * @param {String} didV4 v4 did
   * @param {Contract} migrationContract optional contract instance
   * @return {Promise<TransactionReceipt>}
   */
  public async setMetadataAndTransferNFT(
    address: string,
    migrationAddress: string,
    poolAddressV3: string,
    metaDataState: string,
    metaDataDecryptorUrlAndAddress: string[],
    flags: string,
    data: string,
    metaDataHash: string,
    didV4: string,
    metadataProof?: MetadataProof[],
    contractInstance?: Contract
  ): Promise<TransactionReceipt> {
    if (
      (await this.getPoolStatus(migrationAddress, poolAddressV3)).status !== '2'
    ) {
      throw new Error(`Migration not completed yet`)
    }
    const migrationContract =
      contractInstance ||
      new this.web3.eth.Contract(this.migrationAbi, migrationAddress)

    const estGas = await this.estGasSetMetadataAndTransferNFT(
      address,
      migrationAddress,
      poolAddressV3,
      metaDataState,
      metaDataDecryptorUrlAndAddress,
      flags,
      data,
      metaDataHash,
      didV4,
      metadataProof || [],
      migrationContract
    )

    const trxReceipt = await migrationContract.methods
      .setMetadataAndTransferNFT(
        poolAddressV3,
        metaDataState,
        metaDataDecryptorUrlAndAddress,
        flags,
        data,
        metaDataHash,
        didV4,
        metadataProof || []
      )
      .send({
        from: address,
        gas: estGas + 1,
        gasPrice: await getFairGasPrice(this.web3)
      })

    return trxReceipt
  }

  /**
   * Set metadata
   * @param {String} nftAddress ERC721 addreess
   * @param {String} address User address
   * @param {String} migrationAddress V4Migration address
   * @param {String} poolAddress v4 pool
   * @param {String} metaDataState metaDataState(0,1,..)
   * @param {String[]} metaDataDecryptorUrlAndAddress metaDataState(0,1,..) [decryprtoUrl, decryptorAddress]
   * @param {String[]} bytes [flags,data]
   * @param {String} metaDataHash metaDataHash
   * @param {String} didV4 v4 did
   * @param {Contract} migrationContract optional contract instance
   * @return {Promise<TransactionReceipt>}
   */

  public async setMetadata(
    nftAddress: string,
    address: string,
    metadataState: number,
    metadataDecryptorUrl: string,
    metadataDecryptorAddress: string,
    flags: string,
    data: string,
    metadataHash: string,
    metadataProofs?: MetadataProof[]
  ): Promise<TransactionReceipt> {
    const nftContract = new this.web3.eth.Contract(
      Erc721TemplateAbi as AbiItem[],
      nftAddress
    )

    const trxReceipt = await nftContract.methods
      .setMetaData(
        metadataState,
        metadataDecryptorUrl,
        metadataDecryptorAddress,
        flags,
        data,
        metadataHash,
        metadataProofs
      )
      .send({
        from: address,
        gas: 1000000 + 1, // TODO estimate gas
        gasPrice: await getFairGasPrice(this.web3)
      })

    return trxReceipt
  }

  /** Get Pool Status
   * @param {String} migrationAddress erc721 contract adress
   * @param {String} poolAddressV3 v3 pool address
   * @return {Promise<PoolStatus>} PoolStatus struct
   */
  public async getPoolStatus(
    migrationAddress: string,
    poolAddressV3: string
  ): Promise<PoolStatus> {
    const migrationContract = new this.web3.eth.Contract(
      this.migrationAbi,
      migrationAddress
    )
    return await migrationContract.methods.getPoolStatus(poolAddressV3).call()
  }

  /** Get the nft and erc20 tokens details (names, symbols,tokenURI, addresses)
   * @param {String} migrationAddress erc721 contract adress
   * @param {String} poolAddressV3 v3 pool address
   * @return {Promise<PoolStatus>} PoolStatus struct
   */
  public async getTokensDetails(
    migrationAddress: string,
    poolAddressV3: string
  ): Promise<TokensDetails> {
    const migrationContract = new this.web3.eth.Contract(
      this.migrationAbi,
      migrationAddress
    )
    return await migrationContract.methods
      .getTokensDetails(poolAddressV3)
      .call()
  }

  // TODO: update from shareAllocation to ShareAllocation on the migrationcontract before testing

  /**  Get the user's share allocation in the pool
   * @param {String} migrationAddress erc721 contract adress
   * @param {String} poolAddressV3 v3 pool address
   * @param {String} userAddress user's address we want to check
   * @return {Promise<ShareAllocation>} ShareAllocation struct
   */
  public async getShareAllocation(
    migrationAddress: string,
    poolAddressV3: string,
    userAddress: string
  ): Promise<ShareAllocation> {
    const migrationContract = new this.web3.eth.Contract(
      this.migrationAbi,
      migrationAddress
    )
    return await migrationContract.methods
      .getShareAllocation(poolAddressV3, userAddress)
      .call()
  }

  /**
   *
   * @param {String} address User address
   * @param {String} migrationAddress V4Migration address
   * @param {String} poolAddressV3 v4 pool
   * @param {String} metaDataState metaDataState(0,1,..)
   * @param {String[]} bytes [flags,data]
   * @param {Contract} migrationContract optional contract instance
   * @return {Promise<TransactionReceipt>}
   */
  public async migratePoolAsset(
    address: string,
    migrationAddress: string,
    poolAddressV3: string,
    minAmountsOut: string[],
    metaDataState: string,
    //  metaDataDecryptorUrlAndAddress: string[],
    flags: string,
    data: string,
    //  metaDataHash: string,
    //  didV4: string,
    contractInstance?: Contract
  ): Promise<TransactionReceipt> {
    let tx = await this.liquidateAndCreatePool(
      address,
      migrationAddress,
      poolAddressV3,
      minAmountsOut,
      contractInstance
    )
    const didV3 = (await this.getPoolStatus(migrationAddress, poolAddressV3))
      .didV3
    // TODO: call provider and get
    // metaDataDecryptorUrlAndAddress,
    // metaDataHash,
    // https://github.com/oceanprotocol/provider/blob/v4main/API.md

    // const DDOV4 = await getAndConvertDDO(didV3, 'nftAddress', 'erc20Address')
    console.log('test')
    const metaDataDecryptorUrlAndAddress = ['....', '...']
    const metaDataHash = this.web3.utils.keccak256('METADATA')
    tx = await this.setMetadataAndTransferNFT(
      address,
      migrationAddress,
      poolAddressV3,
      metaDataState,
      metaDataDecryptorUrlAndAddress,
      flags,
      data,
      metaDataHash,
      'DDOV4.id',
      [],
      contractInstance
    )

    return tx
  }

  public generateDidv4(erc721Address: string, chainId: number): string {
    // erc721Address = Web3.utils.toChecksumAddress(erc721Address)
    const checksum = SHA256(erc721Address + chainId.toString(10))
    return `did:op:${checksum.toString()}`
  }

  public async validateAssetAquariusV4(
    asset: v4DDO
  ): Promise<{ validation: MetadataProof; response: any }> {
    const metadataCacheUri =
      process.env.METADATACACHEV4_URI || 'https://v4.aquarius.oceanprotocol.com'

    const response: AxiosResponse<any> = await axios.post(
      `${metadataCacheUri}/api/aquarius/assets/ddo/validate`,
      asset,
      { headers: { 'Content-Type': 'application/octet-stream' } }
    )
    if (!response || response.status !== 200 || !response.data)
      return { response: null, validation: {} }

    const { publicKey: validatorAddress, r, s, v } = response.data

    return {
      response: response.data,
      validation: {
        validatorAddress,
        r: r[0],
        s: s[0],
        v: v
      }
    }
  }

  public async getProviderV4Address(providerUrl: any): Promise<any> {
    const response: AxiosResponse<any> = await axios.get(providerUrl)
    if (!response || response.status !== 200 || !response.data) return false

    return response.data?.providerAddress
  }

  /**
   * Returns the service endpoints that exist in provider.
   * @param {any} endpoints
   * @return {Promise<ServiceEndpoint[]>}
   */
  public async getServiceEndpoints(providerEndpoint: string, endpoints: any) {
    const serviceEndpoints: ServiceEndpoint[] = []

    for (const i in endpoints.serviceEndpoints) {
      const endpoint: ServiceEndpoint = {
        serviceName: i,
        method: endpoints.serviceEndpoints[i][0],
        urlPath: providerEndpoint + endpoints.serviceEndpoints[i][1]
      }
      serviceEndpoints.push(endpoint)
    }
    return serviceEndpoints
  }

  getEndpointURL(
    servicesEndpoints: ServiceEndpoint[],
    serviceName: string
  ): ServiceEndpoint {
    if (!servicesEndpoints) return null
    return servicesEndpoints.find(
      (s) => s.serviceName === serviceName
    ) as ServiceEndpoint
  }

  /** Encrypt data using the Provider's own symmetric key
   * @param {string} data data in json format that needs to be sent , it can either be a DDO or a File array
   * @param {string} providerUri provider uri address
   * @param {AbortSignal} signal abort signal
   * @return {Promise<string>} urlDetails
   */
  public async encryptV4(
    data: any,
    providerUri = 'https://v4.provider.rinkeby.oceanprotocol.com/',
    signal?: AbortSignal
  ): Promise<string> {
    const providerEndpoints = await axios.get(providerUri, {
      headers: {
        'Content-type': 'application/json'
      }
    })

    const serviceEndpoints = await this.getServiceEndpoints(
      providerUri,
      providerEndpoints.data
    )
    const path = this.getEndpointURL(serviceEndpoints, 'encrypt')
      ? this.getEndpointURL(serviceEndpoints, 'encrypt').urlPath
      : null

    if (!path) return null
    try {
      const response = await axios.post(path, decodeURI(JSON.stringify(data)), {
        headers: {
          'Content-Type': 'application/octet-stream'
        }
      })
      return response.data
    } catch (e) {
      console.error(e)
      throw new Error('HTTP request failed')
    }
  }

  public async getAssetUrl(args: any) {
    const response: AxiosResponse<string[]> = await axios.get(
      `https://provider.rinkeby.oceanprotocol.com/api/v1/services/assetUrls`,
      { params: args, headers: { 'Content-Type': 'application/json' } }
    )
    return response.data
  }

  public getHash(data: any): string {
    return sha256(data).toString()
  }

  /**
   *
   * @param {String} address User address
   * @param {String} migrationAddress V4Migration address
   * @param {String} poolAddressV3 v4 pool
   * @param {String} metaDataState metaDataState(0,1,..)
   * @param {String[]} bytes [flags,data]
   * @param {Contract} migrationContract optional contract instance
   * @return {Promise<TransactionReceipt>}
   */
  public async migratePoolAssetTest(
    address = '0xE75fa34968323219f4664080103746a605d18A47',
    migrationAddress = '0x4f5664c1b6e689FA6aEfcc34e56841eB81E5C0d8',
    nftAddress = '0x0884efc69d11ce701c3a1526f5a0f904fecf68ab',
    newDTAddress = '0xad0F41c3E6Dba3Df4c05Eb51d72fBb11d62486d4',
    poolV3Address = '0xf10e7320cd3c668d9cf6b3c5bfa86c395b3dc124',
    oldDdo = '0xa4C982DeB2eAA6b4AF3A75aF0B6eE6F5fdd30cD9'
  ) /* : Promise<TransactionReceipt> */ {
    // contractInstance?: Contract //  didV4: string, //  metaDataHash: string, // bytes: string[], //  metaDataDecryptorUrlAndAddress: string[], // metaDataState: string // minAmountsOut: string[], // poolAddressV3: string, // migrationAddress: string, // address: string,

    const txHash =
      '0x7ad8f180d0d149c687b98cffa9e5e367b40f34dde4d2dc7d51f630476e869aaa'

    // const txReceipt = await this.web3.eth.getTransactionReceipt(txHash)

    const chainId = await this.web3.eth.getChainId()

    const oldDid = `did:op:${oldDdo.replace('0x', '')}`

    const providerUrl = 'https://v4.provider.rinkeby.oceanprotocol.com/' // 'http://127.0.0.1:8030'

    const providerV4Address = await this.getProviderV4Address(providerUrl)

    const v3DDO: v3DDO = await getDDO(oldDid)

    const v4DDO: v4DDO = await convertDDO(
      oldDid,
      v3DDO,
      nftAddress,
      newDTAddress,
      providerUrl
    )

    const providerInstance = new Provider()

    const nonce = await providerInstance.getNonce(
      'https://provider.rinkeby.oceanprotocol.com/',
      '0xE75fa34968323219f4664080103746a605d18A47'
    )

    const did = `did:op:${oldDdo.replace('0x', '')}`
    const message = `${did}${nonce}`
    const signedMessage = await this.web3.eth.sign(message, address)

    const urls = await this.getAssetUrl({
      documentId: did,
      serviceId: '1',
      publisherAddress: address,
      signature: signedMessage
    })

    const files = urls.map((url) => [
      {
        type: 'url',
        url: url,
        method: 'GET'
      }
    ])

    const encryptedFiles = await this.encryptV4(files, providerUrl)

    const nft = new this.web3.eth.Contract(
      ERC721Template.abi as AbiItem[],
      nftAddress
    )

    const poolDdo = { ...v4DDO }

    poolDdo.services[0].files = encryptedFiles

    poolDdo.chainId = chainId

    poolDdo.id = this.generateDidv4(nftAddress, chainId)

    const validation = await this.validateAssetAquariusV4(poolDdo)

    const metaDataDecryptorUrlAndAddress = [providerUrl, providerV4Address]

    const encryptedDdo = await this.encryptV4(poolDdo, providerUrl)

    const metadataHash = this.getHash(JSON.stringify(poolDdo))

    // assert(
    //   validation.hash === '0x' + metadataHash,
    //   'Metadata hash is a missmatch'
    // )

    console.log(metadataHash)
    this.web3.utils.asciiToHex('SomeData')

    const tx = await this.setMetadataAndTransferNFT(
      address,
      migrationAddress,
      poolV3Address,
      '0',
      metaDataDecryptorUrlAndAddress,
      '0x2',
      encryptedDdo,
      '0x' + metadataHash,
      poolDdo.id
    )

    await this.setMetadata(
      nftAddress,
      address,
      0,
      providerUrl,
      providerV4Address,
      '0x2',
      encryptedDdo,
      '0x' + metadataHash,
      []
    )

    return tx
  }

  public async runMigration(
    address: string,
    migrationAddress: string,
    poolAddressV3: string,
    minAmountsOut: string[],
    contractInstance?: Contract
  ): Promise<TransactionReceipt> {
    const liquidationTrxReceipt = await this.liquidateAndCreatePool(
      address,
      migrationAddress,
      poolAddressV3,
      minAmountsOut,
      contractInstance
    )

    const args = liquidationTrxReceipt.events.NewPool.returnValues

    // const args = {
    //   nftAddress: '0x16602FD45320B105750A8Fd3634096D181a194F4',
    //   newDTAddress: '0xD5Fcef24e2D1f83f85f4F64Ae179fA5b94f3a28d',
    //   v3DTAddress: '0x91dB4B1a10Bec43b63Bcb51C755bD0f312A8Dd24',
    //   newPool: '',
    //   lptRounding: ''
    // }

    console.log('ARGS ', args)

    const { nftAddress, newDTAddress, v3DTAddress } = args

    const chainId = await this.web3.eth.getChainId()

    console.log('Migration NewPool event :', args)

    const oldDid = `did:op:${v3DTAddress.replace('0x', '')}`

    const providerUrl = 'https://v4.provider.rinkeby.oceanprotocol.com/' // 'http://127.0.0.1:8030'

    const providerV3Url = 'https://provider.rinkeby.oceanprotocol.com/'

    const providerV4Address = await this.getProviderV4Address(providerUrl)

    const v3DDO: v3DDO = await getDDO(oldDid)

    const v4DDO: v4DDO = await convertDDO(
      oldDid,
      v3DDO,
      nftAddress,
      newDTAddress,
      providerUrl
    )

    const providerInstance = new Provider()

    const nonce = await providerInstance.getNonce(providerV3Url, address)

    const message = `${oldDid}${nonce}`
    const messageHash = await this.web3.utils.utf8ToHex(message)

    // const signedMessage = await this.web3.eth.sign(messageHash, address)

    const signedMessage = await this.web3.eth.personal.sign(
      messageHash,
      address,
      null
    )

    console.log('SIGNED MESSAGE ', signedMessage)

    const urls = await this.getAssetUrl({
      documentId: oldDid,
      serviceId: '1',
      publisherAddress: address,
      signature: signedMessage
    })

    console.log('Urls : ', urls)

    const files = urls.map((url) => ({
      type: 'url',
      url: url,
      method: 'GET'
    }))

    const encryptedFiles = await this.encryptV4(files, providerUrl)

    const valid = await providerInstance.isValidProvider(providerUrl)

    console.log('Is provider valid?', valid)

    const poolDdo = { ...v4DDO }

    poolDdo.services[0].files = encryptedFiles

    poolDdo.chainId = chainId

    poolDdo.id = this.generateDidv4(nftAddress, chainId)

    const { validation, response } = await this.validateAssetAquariusV4(poolDdo)

    const metaDataDecryptorUrlAndAddress = [providerUrl, providerV4Address]

    const encryptedDdo = await this.encryptV4(poolDdo, providerUrl)

    const metadataHash = this.getHash(JSON.stringify(poolDdo))

    const isValid = response.hash === '0x' + metadataHash // Should be true

    console.log('Is asset valid?', isValid)

    let tx = await this.setMetadataAndTransferNFT(
      address,
      migrationAddress,
      poolAddressV3,
      '0',
      metaDataDecryptorUrlAndAddress,
      '0x2',
      encryptedDdo,
      '0x' + metadataHash,
      poolDdo.id,
      [validation]
    )

    tx = await this.setMetadata(
      nftAddress,
      address,
      0,
      providerUrl,
      providerV4Address,
      '0x2',
      encryptedDdo,
      '0x' + metadataHash,
      [validation]
    )

    return tx
  }
}
