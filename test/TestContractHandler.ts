import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'
import { AbiItem } from 'web3-utils/types'
import MockERC20 from '@oceanprotocol/contracts/artifacts/contracts/utils/mock/MockERC20Decimals.sol/MockERC20Decimals.json'
import V4Migration from './../src/artifacts/V4Migration.json'
import MigrationStaking from './../src/artifacts/MigrationStaking.json'
import V3BFactory from './../src/artifacts/V3BFactory.json'
import V3DTFactory from './../src/artifacts/V3DTFactory.json'
import V3BPoolTemplate from './../src/artifacts/V3BPool.json'
import V3DatatokenTemplate from './../src/artifacts/V3DataTokenTemplate.json'

export class TestContractHandler {
  public accounts: string[]
  public ERC721Factory: Contract
  public ERC20Template: Contract
  public ERC721Template: Contract
  public Router: Contract
  public SideStaking: Contract
  public FixedRate: Contract
  public Dispenser: Contract
  public OPFCollector: Contract
  public PoolTemplate: Contract
  public MockERC20: Contract
  public MockOcean: Contract
  public Migration: Contract
  public MigrationStaking: Contract
  public V3BFactory: Contract
  public V3DTFactory: Contract
  public V3BPoolTemplate: Contract
  public V3DatatokenTemplate: Contract

  public ERC721FactoryBytecode: string
  public ERC20TemplateBytecode: string
  public ERC721TemplateBytecode: string
  public RouterBytecode: string
  public SideStakingBytecode: string
  public FixedRateBytecode: string
  public DispenserBytecode: string
  public PoolTemplateBytecode: string
  public OPFCollectorBytecode: string
  public MockERC20Bytecode: string
  public OPFBytecode: string
  public MigrationBytecode: string
  public MigrationStakingBytecode: string
  public V3BFactoryBytecode: string
  public V3DTFactoryBytecode: string
  public V3BPoolTemplateBytecode: string
  public V3DatatokenTemplateBytecode: string

  public factory721Address: string
  public template721Address: string
  public template20Address: string
  public routerAddress: string
  public sideStakingAddress: string
  public fixedRateAddress: string
  public dispenserAddress: string
  public poolTemplateAddress: string
  public opfCollectorAddress: string
  public oceanAddress: string
  public daiAddress: string
  public usdcAddress: string
  public migrationAddress: string
  public migrationStakingAddress: string
  public v3BFactoryAddress: string
  public v3DTFactoryAddress: string
  public v3BPoolTemplateAddress: string
  public v3DatatokenTemplateAddress: string
  public web3: Web3

  constructor(
    web3: Web3,
    ERC721TemplateABI: AbiItem | AbiItem[],
    ERC20TemplateABI: AbiItem | AbiItem[],
    PoolTemplateABI?: AbiItem | AbiItem[],
    ERC721FactoryABI?: AbiItem | AbiItem[],
    RouterABI?: AbiItem | AbiItem[],
    SideStakingABI?: AbiItem | AbiItem[],
    FixedRateABI?: AbiItem | AbiItem[],
    DispenserABI?: AbiItem | AbiItem[],
    OPFABI?: AbiItem | AbiItem[],

    template721Bytecode?: string,
    template20Bytecode?: string,
    poolTemplateBytecode?: string,
    factory721Bytecode?: string,
    routerBytecode?: string,
    sideStakingBytecode?: string,
    fixedRateBytecode?: string,
    dispenserBytecode?: string,
    opfBytecode?: string,
    migrationBytecode?: string,
    migrationStakingBytecode?: string
  ) {
    this.web3 = web3
    this.ERC721Template = new this.web3.eth.Contract(ERC721TemplateABI)
    this.ERC20Template = new this.web3.eth.Contract(ERC20TemplateABI)
    this.PoolTemplate = new this.web3.eth.Contract(PoolTemplateABI)
    this.ERC721Factory = new this.web3.eth.Contract(ERC721FactoryABI)
    this.Router = new this.web3.eth.Contract(RouterABI)
    this.SideStaking = new this.web3.eth.Contract(SideStakingABI)
    this.FixedRate = new this.web3.eth.Contract(FixedRateABI)
    this.Dispenser = new this.web3.eth.Contract(DispenserABI)
    this.MockERC20 = new this.web3.eth.Contract(MockERC20.abi as AbiItem[])
    this.OPFCollector = new this.web3.eth.Contract(OPFABI)
    this.Migration = new this.web3.eth.Contract(V4Migration.abi as AbiItem[])
    this.MigrationStaking = new this.web3.eth.Contract(
      MigrationStaking.abi as AbiItem[]
    )
    this.V3BFactory = new this.web3.eth.Contract(V3BFactory.abi as AbiItem[])
    this.V3DTFactory = new this.web3.eth.Contract(V3DTFactory.abi as AbiItem[])
    this.V3BPoolTemplate = new this.web3.eth.Contract(
      V3BPoolTemplate.abi as AbiItem[]
    )
    this.V3DatatokenTemplate = new this.web3.eth.Contract(
      V3DatatokenTemplate.abi as AbiItem[]
    )

    this.ERC721FactoryBytecode = factory721Bytecode
    this.ERC20TemplateBytecode = template20Bytecode
    this.PoolTemplateBytecode = poolTemplateBytecode
    this.ERC721TemplateBytecode = template721Bytecode
    this.RouterBytecode = routerBytecode
    this.SideStakingBytecode = sideStakingBytecode
    this.FixedRateBytecode = fixedRateBytecode
    this.DispenserBytecode = dispenserBytecode
    this.MockERC20Bytecode = MockERC20.bytecode
    this.OPFBytecode = opfBytecode
    this.MigrationBytecode = V4Migration.bytecode
    this.MigrationStakingBytecode = MigrationStaking.bytecode
    this.V3BFactoryBytecode = V3BFactory.bytecode
    this.V3DTFactoryBytecode = V3DTFactory.bytecode
    this.V3BPoolTemplateBytecode = V3BPoolTemplate.bytecode
    this.V3DatatokenTemplateBytecode = V3DatatokenTemplate.bytecode
  }

  public async getAccounts(): Promise<string[]> {
    this.accounts = await this.web3.eth.getAccounts()
    return this.accounts
  }

  public async deployContracts(owner: string, routerABI?: AbiItem | AbiItem[]) {
    let estGas
    // DEPLOY V3 CONTRACTS, DT template , DT Factory, BPool and BFactory
    const name = 'Template'
    const symbol = 'TEMPL'
    const cap = this.web3.utils.toWei('10000')
    const minter = owner
    const blob = 'https://example.com/dataset-1'

    // v3 Datatoken Template
    estGas = await this.V3DatatokenTemplate.deploy({
      data: this.V3DatatokenTemplateBytecode,
      arguments: [name, symbol, owner, cap, blob, owner]
    }).estimateGas(function (err, estGas) {
      if (err) console.log('DeployContracts: ' + err)
      return estGas
    })
    // deploy the contract and get it's address
    this.v3DatatokenTemplateAddress = await this.V3DatatokenTemplate.deploy({
      data: this.V3DatatokenTemplateBytecode,
      arguments: [name, symbol, owner, cap, blob, owner]
    })
      .send({
        from: owner,
        gas: estGas + 1,
        gasPrice: '3000000000'
      })
      .then(function (contract) {
        return contract.options.address
      })

    // V3 DT Factory
    estGas = await this.V3DTFactory.deploy({
      data: this.V3DTFactoryBytecode,
      arguments: [this.v3DatatokenTemplateAddress, owner]
    }).estimateGas(function (err, estGas) {
      if (err) console.log('DeployContracts: ' + err)
      return estGas
    })
    // deploy the contract and get it's address
    this.v3DTFactoryAddress = await this.V3DTFactory.deploy({
      data: this.V3DTFactoryBytecode,
      arguments: [this.v3DatatokenTemplateAddress, owner]
    })
      .send({
        from: owner,
        gas: estGas + 1,
        gasPrice: '3000000000'
      })
      .then(function (contract) {
        return contract.options.address
      })

    // V3 Pool template
    estGas = await this.V3BPoolTemplate.deploy({
      data: this.V3BPoolTemplateBytecode,
      arguments: []
    }).estimateGas(function (err, estGas) {
      if (err) console.log('DeployContracts: ' + err)
      return estGas
    })

    this.v3BPoolTemplateAddress = await this.V3BPoolTemplate.deploy({
      data: this.V3BPoolTemplateBytecode,
      arguments: []
    })
      .send({
        from: owner,
        gas: estGas + 1,
        gasPrice: '3000000000'
      })
      .then(function (contract) {
        return contract.options.address
      })

    // V3 Pool Factory
    estGas = await this.V3BFactory.deploy({
      data: this.V3BFactoryBytecode,
      arguments: [this.v3BPoolTemplateAddress]
    }).estimateGas(function (err, estGas) {
      if (err) console.log('DeployContracts: ' + err)
      return estGas
    })

    this.v3BFactoryAddress = await this.V3BFactory.deploy({
      data: this.V3BFactoryBytecode,
      arguments: [this.v3BPoolTemplateAddress]
    })
      .send({
        from: owner,
        gas: estGas + 1,
        gasPrice: '3000000000'
      })
      .then(function (contract) {
        return contract.options.address
      })

    // DEPLOY OPF Fee Collector
    // get est gascost
    estGas = await this.OPFCollector.deploy({
      data: this.OPFBytecode,
      arguments: [owner, owner]
    }).estimateGas(function (err, estGas) {
      if (err) console.log('DeployContracts: ' + err)
      return estGas
    })
    // deploy the contract and get it's address
    this.opfCollectorAddress = await this.OPFCollector.deploy({
      data: this.OPFBytecode,
      arguments: [owner, owner]
    })
      .send({
        from: owner,
        gas: estGas + 1,
        gasPrice: '3000000000'
      })
      .then(function (contract) {
        return contract.options.address
      })

    // DEPLOY POOL TEMPLATE
    // get est gascost
    estGas = await this.PoolTemplate.deploy({
      data: this.PoolTemplateBytecode,
      arguments: []
    }).estimateGas(function (err, estGas) {
      if (err) console.log('DeployContracts: ' + err)
      return estGas
    })
    // deploy the contract and get it's address
    this.poolTemplateAddress = await this.PoolTemplate.deploy({
      data: this.PoolTemplateBytecode,
      arguments: []
    })
      .send({
        from: owner,
        gas: estGas + 1,
        gasPrice: '3000000000'
      })
      .then(function (contract) {
        return contract.options.address
      })

    // DEPLOY ERC20 TEMPLATE
    // get est gascost
    estGas = await this.ERC20Template.deploy({
      data: this.ERC20TemplateBytecode,
      arguments: []
    }).estimateGas(function (err, estGas) {
      if (err) console.log('DeployContracts: ' + err)
      return estGas
    })
    // deploy the contract and get it's address
    this.template20Address = await this.ERC20Template.deploy({
      data: this.ERC20TemplateBytecode,
      arguments: []
    })
      .send({
        from: owner,
        gas: estGas + 1,
        gasPrice: '3000000000'
      })
      .then(function (contract) {
        return contract.options.address
      })

    // DEPLOY ERC721 TEMPLATE
    // get est gascost
    estGas = await this.ERC721Template.deploy({
      data: this.ERC721TemplateBytecode,
      arguments: []
    }).estimateGas(function (err, estGas) {
      if (err) console.log('DeployContracts: ' + err)
      return estGas
    })
    // deploy the contract and get it's address
    this.template721Address = await this.ERC721Template.deploy({
      data: this.ERC721TemplateBytecode,
      arguments: []
    })
      .send({
        from: owner,
        gas: estGas + 1,
        gasPrice: '3000000000'
      })
      .then(function (contract) {
        return contract.options.address
      })

    // DEPLOY OCEAN MOCK
    // get est gascost
    estGas = await this.MockERC20.deploy({
      data: this.MockERC20Bytecode,
      arguments: ['OCEAN', 'OCEAN', 18]
    }).estimateGas(function (err, estGas) {
      if (err) console.log('DeployContracts: ' + err)
      return estGas
    })
    // deploy the contract and get it's address
    this.oceanAddress = await this.MockERC20.deploy({
      data: this.MockERC20Bytecode,
      arguments: ['OCEAN', 'OCEAN', 18]
    })
      .send({
        from: owner,
        gas: estGas + 1,
        gasPrice: '3000000000'
      })
      .then(function (contract) {
        return contract.options.address
      })

    // DEPLOY ROUTER
    estGas = await this.Router.deploy({
      data: this.RouterBytecode,
      arguments: [
        owner,
        this.oceanAddress,
        this.poolTemplateAddress,
        this.opfCollectorAddress,
        []
      ]
    }).estimateGas(function (err, estGas) {
      if (err) console.log('DeployContracts: ' + err)
      return estGas
    })
    // deploy the contract and get it's address
    this.routerAddress = await this.Router.deploy({
      data: this.RouterBytecode,
      arguments: [
        owner,
        this.oceanAddress,
        this.poolTemplateAddress,
        this.opfCollectorAddress,
        []
      ]
    })
      .send({
        from: owner,
        gas: estGas + 1,
        gasPrice: '3000000000'
      })
      .then(function (contract) {
        return contract.options.address
      })

    // DEPLOY SIDE STAKING
    estGas = await this.SideStaking.deploy({
      data: this.SideStakingBytecode,
      arguments: [this.routerAddress]
    }).estimateGas(function (err, estGas) {
      if (err) console.log('DeployContracts: ' + err)
      return estGas
    })
    // deploy the contract and get it's address
    this.sideStakingAddress = await this.SideStaking.deploy({
      data: this.SideStakingBytecode,
      arguments: [this.routerAddress]
    })
      .send({
        from: owner,
        gas: estGas + 1,
        gasPrice: '3000000000'
      })
      .then(function (contract) {
        return contract.options.address
      })

    // DEPLOY FIXED RATE
    estGas = await this.FixedRate.deploy({
      data: this.FixedRateBytecode,
      arguments: [this.routerAddress, this.opfCollectorAddress]
    }).estimateGas(function (err, estGas) {
      if (err) console.log('DeployContracts: ' + err)
      return estGas
    })
    // deploy the contract and get it's address
    this.fixedRateAddress = await this.FixedRate.deploy({
      data: this.FixedRateBytecode,
      arguments: [this.routerAddress, this.opfCollectorAddress]
    })
      .send({
        from: owner,
        gas: estGas + 1,
        gasPrice: '3000000000'
      })
      .then(function (contract) {
        return contract.options.address
      })

    // DEPLOY Dispenser
    estGas = await this.Dispenser.deploy({
      data: this.DispenserBytecode,
      arguments: [this.routerAddress]
    }).estimateGas(function (err, estGas) {
      if (err) console.log('DeployContracts: ' + err)
      return estGas
    })
    // deploy the contract and get it's address
    this.dispenserAddress = await this.Dispenser.deploy({
      data: this.DispenserBytecode,
      arguments: [this.routerAddress]
    })
      .send({
        from: owner,
        gas: estGas + 1,
        gasPrice: '3000000000'
      })
      .then(function (contract) {
        return contract.options.address
      })

    // DEPLOY ERC721 FACTORY
    estGas = await this.ERC721Factory.deploy({
      data: this.ERC721FactoryBytecode,
      arguments: [
        this.template721Address,
        this.template20Address,
        this.opfCollectorAddress,
        this.routerAddress
      ]
    }).estimateGas(function (err, estGas) {
      if (err) console.log('DeployContracts: ' + err)
      return estGas
    })
    // deploy the contract and get it's address
    this.factory721Address = await this.ERC721Factory.deploy({
      data: this.ERC721FactoryBytecode,
      arguments: [
        this.template721Address,
        this.template20Address,
        this.opfCollectorAddress,
        this.routerAddress
      ]
    })
      .send({
        from: owner,
        gas: estGas + 1,
        gasPrice: '3000000000'
      })
      .then(function (contract) {
        return contract.options.address
      })

    // DEPLOY USDC MOCK
    // get est gascost
    estGas = await this.MockERC20.deploy({
      data: this.MockERC20Bytecode,
      arguments: ['USDC', 'USDC', 6]
    }).estimateGas(function (err, estGas) {
      if (err) console.log('DeployContracts: ' + err)
      return estGas
    })
    // deploy the contract and get it's address
    this.usdcAddress = await this.MockERC20.deploy({
      data: this.MockERC20Bytecode,
      arguments: ['USDC', 'USDC', 6]
    })
      .send({
        from: owner,
        gas: estGas + 1,
        gasPrice: '3000000000'
      })
      .then(function (contract) {
        return contract.options.address
      })

    // DEPLOY DAI MOCK
    // get est gascost
    estGas = await this.MockERC20.deploy({
      data: this.MockERC20Bytecode,
      arguments: ['DAI', 'DAI', 18]
    }).estimateGas(function (err, estGas) {
      if (err) console.log('DeployContracts: ' + err)
      return estGas
    })
    // deploy the contract and get it's address
    this.daiAddress = await this.MockERC20.deploy({
      data: this.MockERC20Bytecode,
      arguments: ['DAI', 'DAI', 18]
    })
      .send({
        from: owner,
        gas: estGas + 1,
        gasPrice: '3000000000'
      })
      .then(function (contract) {
        return contract.options.address
      })

    // DEPLOY Migration Contract
    // get est gascost
    estGas = await this.Migration.deploy({
      data: this.MigrationBytecode,
      arguments: [
        this.factory721Address,
        this.oceanAddress,
        this.poolTemplateAddress,
        owner
      ]
    }).estimateGas(function (err, estGas) {
      if (err) console.log('DeployContracts: ' + err)
      return estGas
    })
    // deploy the contract and get it's address
    this.migrationAddress = await this.Migration.deploy({
      data: this.MigrationBytecode,
      arguments: [
        this.factory721Address,
        this.oceanAddress,
        this.poolTemplateAddress,
        owner
      ]
    })
      .send({
        from: owner,
        gas: estGas + 1,
        gasPrice: '3000000000'
      })
      .then(function (contract) {
        return contract.options.address
      })

    // DEPLOY MigrationStaking Contract
    // get est gascost
    estGas = await this.MigrationStaking.deploy({
      data: this.MigrationStakingBytecode,
      arguments: [this.routerAddress, this.migrationAddress]
    }).estimateGas(function (err, estGas) {
      if (err) console.log('DeployContracts: ' + err)
      return estGas
    })
    // deploy the contract and get it's address
    this.migrationStakingAddress = await this.MigrationStaking.deploy({
      data: this.MigrationStakingBytecode,
      arguments: [this.routerAddress, this.migrationAddress]
    })
      .send({
        from: owner,
        gas: estGas + 1,
        gasPrice: '3000000000'
      })
      .then(function (contract) {
        return contract.options.address
      })

    const RouterContract = new this.web3.eth.Contract(
      routerABI,
      this.routerAddress
    )

    const MigrationContract = new this.web3.eth.Contract(
      V4Migration.abi as AbiItem[],
      this.migrationAddress
    )

    await RouterContract.methods
      .addFactory(this.factory721Address)
      .send({ from: owner })
    await RouterContract.methods
      .addFixedRateContract(this.fixedRateAddress)
      .send({ from: owner })
    await RouterContract.methods
      .addDispenserContract(this.dispenserAddress)
      .send({ from: owner })
    await RouterContract.methods
      .addSSContract(this.sideStakingAddress)
      .send({ from: owner })

    // set MigrationStaking address both on Router and Migration
    await RouterContract.methods
      .addSSContract(this.migrationStakingAddress)
      .send({ from: owner })

    await MigrationContract.methods
      .addMigrationStaking(this.migrationStakingAddress)
      .send({ from: owner })
    // await RouterContract.methods
    //   .changeRouterOwner(this.opfCollectorAddress)
    //   .send({ from: owner })
  }
}
