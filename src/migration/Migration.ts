import Web3 from 'web3'
import { AbiItem } from 'web3-utils'
import { TransactionReceipt } from 'web3-eth'
import defaultMigrationAbi from './defaultMigrationABI.json'
import { getFairGasPrice } from '../utils'
import { Contract } from 'web3-eth-contract'

/**
 * Pool Info
 */
interface PoolStatus {
  migrationStatus: number
  poolV3Address: string
  poolV4Address: string
  didV3: string
  didV4: string
  owner: string
  poolShareOwners: string[]
  dtV3Address: string
  totalOcean: number
  totalDTBurnt: number
  newLPTAmount: number
  lptRounding: number
  deadline: number
}

/**
 * Tokens Details
 */
interface TokensDetails {
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
interface ShareAllocation {
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

  constructor(web3: Web3, nftAbi?: AbiItem | AbiItem[], startBlock?: number) {
    this.migrationAbi = this.migrationAbi || (defaultMigrationAbi as AbiItem[])
    this.web3 = web3
    this.startBlock = startBlock || 0
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
  ): Promise<string> {
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
    lptV3Amount: string,
    contractInstance?: Contract
  ): Promise<string> {
    // Create migration object
    const migrationContract =
      contractInstance ||
      new this.web3.eth.Contract(this.migrationAbi, migrationAddress)

    const estGas = await this.estGasCancelMigration(
      address,
      migrationAddress,
      poolAddressV3,
      lptV3Amount,
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
  ): Promise<string> {
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
      .liquidateAndCreatePool(poolAddressV3)
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
    metaDataDecryptorUrlAndAddress: string,
    bytes: string,
    metaDataHash: string,
    didV4: string,
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
          bytes,
          metaDataHash,
          didV4
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
   * @param {String} metaDataDecryptorUrlAndAddress metaDataState(0,1,..)
   * @param {String} bytes flags,data
   * @param {String} metaDataHash metaDataHash
   * @param {String} didV4 v4 did
   * @param {Contract} migrationContract optional contract instance
   * @return {Promise<TransactionReceipt>}
   */
  public async setMetadataAndTransferNFT(
    address: string,
    migrationAddress: string,
    poolAddress: string,
    metaDataState: string,
    metaDataDecryptorUrlAndAddress: string,
    bytes: string,
    metaDataHash: string,
    didV4: string,
    contractInstance?: Contract
  ): Promise<string> {
    const migrationContract =
      contractInstance ||
      new this.web3.eth.Contract(this.migrationAbi, migrationAddress)

    const estGas = await this.estGasSetMetadataAndTransferNFT(
      address,
      migrationAddress,
      poolAddress,
      metaDataState,
      metaDataDecryptorUrlAndAddress,
      bytes,
      metaDataHash,
      didV4,
      migrationContract
    )

    const trxReceipt = await migrationContract.methods
      .setMetadataAndTransferNFT(
        poolAddress,
        metaDataState,
        metaDataDecryptorUrlAndAddress,
        bytes,
        metaDataHash,
        didV4
      )
      .send({
        from: address,
        gas: estGas + 1,
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
}
