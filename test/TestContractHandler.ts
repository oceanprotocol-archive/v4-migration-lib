import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'
import { AbiItem } from 'web3-utils/types'
import MockERC20 from './../src/artifacts/MockERC20.json'
import V3BFactory from './../src/artifacts/V3BFactory.json'
import V3DTFactory from './../src/artifacts/DTFactory.json'
import V3BPoolTemplate from './../src/artifacts/V3BPool.json'
import V3DatatokenTemplate from './../src/artifacts/DataTokenTemplate.json'

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

  public v3BFactoryAddress: string
  public v3DTFactoryAddress: string
  public v3BPoolTemplateAddress: string
  public v3DatatokenTemplateAddress: string
  public v3dt1Address: string
  public v3dt2Address: string
  public v3pool1Address: string
  public v3pool2Address: string
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
    migrationBytecode?: string
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

    this.V3BFactoryBytecode = V3BFactory.bytecode
    this.V3DTFactoryBytecode = V3DTFactory.bytecode
    this.V3BPoolTemplateBytecode = V3BPoolTemplate.bytecode
    this.V3DatatokenTemplateBytecode = V3DatatokenTemplate.bytecode
  }

  public async getAccounts(): Promise<string[]> {
    try {
      this.accounts = await this.web3.eth.getAccounts()
    } catch (error) {
      console.log('Get Accounts Error:', error)
    }
    return this.accounts
  }

  public async deployContracts(
    owner: string,
    daemon: string,
    routerABI?: AbiItem | AbiItem[]
  ) {
    let estGas
    // DEPLOY V3 CONTRACTS, DT template , DT Factory, BPool and BFactory
    const name = 'Template'
    const symbol = 'TEMPL'
    const cap = this.web3.utils.toWei('100000')
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

    // V3 DT and Pool Creation
    const RouterContract = new this.web3.eth.Contract(
      routerABI,
      this.routerAddress
    )
    const V3DtFactory = new this.web3.eth.Contract(
      V3DTFactory.abi as AbiItem[],
      this.v3DTFactoryAddress
    )

    const V3PoolFactory = new this.web3.eth.Contract(
      V3BFactory.abi as AbiItem[],
      this.v3BFactoryAddress
    )
    let trxReceipt
    // CREATE V3 datatoken1
    try {
      trxReceipt = await V3DtFactory.methods
        .createToken('https://dataset1.dao', 'Token1', 'Tk1', cap)
        .send({ from: owner })
    } catch (e) {
      console.log(e.message)
    }

    this.v3dt1Address =
      trxReceipt.events.TokenCreated.returnValues.newTokenAddress

    trxReceipt = await V3DtFactory.methods
      .createToken('https://dataset2.dao', 'Token2', 'Tk2', cap)
      .send({ from: owner })

    this.v3dt2Address =
      trxReceipt.events.TokenCreated.returnValues.newTokenAddress

    // DEPLOY V3 POOL1
    trxReceipt = await V3PoolFactory.methods.newBPool().send({ from: owner })
    this.v3pool1Address =
      trxReceipt.events.BPoolCreated.returnValues.newBPoolAddress

    const V3Pool1 = new this.web3.eth.Contract(
      V3BPoolTemplate.abi as AbiItem[],
      this.v3pool1Address
    )

    // DEPLOY V3 POOL2
    trxReceipt = await V3PoolFactory.methods.newBPool().send({ from: owner })
    this.v3pool2Address =
      trxReceipt.events.BPoolCreated.returnValues.newBPoolAddress

    const V3Pool2 = new this.web3.eth.Contract(
      V3BPoolTemplate.abi as AbiItem[],
      this.v3pool2Address
    )
    // APPROVE OCEAN and v3 DTs in both Pools
    const OceanMock = new this.web3.eth.Contract(
      MockERC20.abi as AbiItem[],
      this.oceanAddress
    )

    const Dt1Mock = new this.web3.eth.Contract(
      V3DatatokenTemplate.abi as AbiItem[],
      this.v3dt1Address
    )
    const Dt2Mock = new this.web3.eth.Contract(
      V3DatatokenTemplate.abi as AbiItem[],
      this.v3dt2Address
    )

    await Dt1Mock.methods.mint(owner, cap).send({ from: owner })
    await Dt2Mock.methods.mint(owner, cap).send({ from: owner })

    const MAX = this.web3.utils.toTwosComplement(-1)

    await OceanMock.methods
      .approve(this.v3pool1Address, MAX)
      .send({ from: owner })

    await Dt1Mock.methods
      .approve(this.v3pool1Address, MAX)
      .send({ from: owner })

    await OceanMock.methods
      .approve(this.v3pool2Address, MAX)
      .send({ from: owner })

    await Dt2Mock.methods
      .approve(this.v3pool2Address, MAX)
      .send({ from: owner })

    // SETUP v3 POOLS

    await V3Pool1.methods
      .setup(
        this.v3dt1Address,
        this.web3.utils.toWei('10000'),
        this.web3.utils.toWei('25'),
        this.oceanAddress,
        this.web3.utils.toWei('10000'),
        this.web3.utils.toWei('25'),
        1e15
      )
      .send({ from: owner })

    await V3Pool2.methods
      .setup(
        this.v3dt2Address,
        this.web3.utils.toWei('10000'),
        this.web3.utils.toWei('25'),
        this.oceanAddress,
        this.web3.utils.toWei('20000'),
        this.web3.utils.toWei('25'),
        1e15
      )
      .send({ from: owner })

    // v3 lpt owner transfer half of his LPTs to user1 and user2 (30 y 20 Lpts respectively)
    await V3Pool1.methods
      .transfer(this.accounts[1], this.web3.utils.toWei('30')) // 30 out of 100
      .send({ from: owner })
    await V3Pool1.methods
      .transfer(this.accounts[2], this.web3.utils.toWei('20')) // 20 out of 100
      .send({ from: owner })

    // V4 set up
    await RouterContract.methods
      .addFactory(this.factory721Address)
      .send({ from: owner })
    await RouterContract.methods
      .addFixedRateContract(this.fixedRateAddress)
      .send({ from: owner })

    await RouterContract.methods
      .addSSContract(this.sideStakingAddress)
      .send({ from: owner })

    // await RouterContract.methods
    //   .changeRouterOwner(this.opfCollectorAddress)
    //   .send({ from: owner })
  }
}
