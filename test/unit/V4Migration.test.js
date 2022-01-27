const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers')
const { impersonate } = require('../../helpers/impersonate')
const { web3 } = require('@openzeppelin/test-helpers/src/setup')
const balance = require('@openzeppelin/test-helpers/src/balance')
const constants = require('../../helpers/constants')
const BigNumber = web3.BigNumber
const { assert, expect } = require('chai')
const addressZero = '0x0000000000000000000000000000000000000000'
const addressOne = '0x0000000000000000000000000000000000000001'
//const { ethers } = require("ethers");
require('chai').use(require('chai-bignumber')(BigNumber)).should()
require('dotenv').config()
describe('V4Migration', function () {
  let migrationContract,
    Migration,
    ERC721Template,
    ERC721Factory,
    templateERC721,
    ERC20Template,
    BPool,
    Router,
    dtPoolContract

  const communityFeeCollector = '0xeE9300b7961e0a01d9f0adb863C7A227A07AaD75'
  // First Pool LUMSTA-42 (Amazon products pages)
  const v3Datatoken = '0xa2B8b3aC4207CFCCbDe4Ac7fa40214fd00A2BA71'
  const v3DTOwner = '0x12BD31628075C20919BA838b89F414241b8c4869'
  const v3PoolAddress = '0xaD67F7a72BA2ca971390B2a1dD907303bD577a4F'
  // Swash - Consumer Browsing Data
  // const v3DTOwner = '0x242752acA5c560457a3C49d17d6F7824a595af18'
  // const v3PoolAddress = '0x2655b8A7357f4Bb4a8CB2170e196096aC8F0CDF9'
  // const v3Datatoken = '0xb07a8bb80242752ce164560ABCb6517DA90a4F65'
  // const v3DTOtherUser = '0xdee11264f3d7fcb86130fe6b8cedce42d964ccfe'
  // const v3DTOtherUser2 = '0xe81a1dc876ec6e7c520a7cc3126f0ea368070e92'
  // Second Pool QUICRA-0 (DataUnion.app)
  const v3Datatoken2 = '0x7Bce67697eD2858d0683c631DdE7Af823b7eea38'
  const v3DTOwner2 = '0x655eFe6Eb2021b8CEfE22794d90293aeC37bb325'
  const v3DTuser2 = '0x26c04902226c263a0d6a1d3ff0c6e6e73f5f78e6'
  const v3DTuser3 = '0x766337d18e12df977b5f54516b2333e39e7dcb5a'
  const v3DTuser4 = '0xce7be31f48205c48a91a84e777a66252bba87f0b'
  const v3PoolAddress2 = '0xAAB9EaBa1AA2653c1Dda9846334700b9F5e14E44'
  const oceanAddress = '0x967da4048cD07aB37855c090aAF366e4ce1b9F48'
  const didV3 = 'did:op:a2B8b3aC4207CFCCbDe4Ac7fa40214fd00A2BA71'
  const nftName = 'NFTname'
  const nftSymbol = 'NFTSymbol'
  const tokenURI = 'https://oceanprotocol.com/nft/'
  const erc20Name = 'V4ERC20Name'
  const erc20Symbol = 'V4ERC20Symbol'

  const metaDataDecryptorUrlAndAddress = ['http://myprovider:8030', '0x123']
  const flagsAndData = [
    web3.utils.asciiToHex(constants.blob[0]),
    web3.utils.asciiToHex('SomeData')
  ]
  const metaDataState = 1
  const metadataHash = web3.utils.keccak256('METADATA')
  const didV4 = 'did:op:0x2121'

  before(async function () {
    // reset fork for full testing
    await network.provider.request({
      method: 'hardhat_reset',
      params: [
        {
          forking: {
            jsonRpcUrl: process.env.ALCHEMY_URL,
            blockNumber: 12545000
          }
        }
      ]
    })
    ;[deployer, alice, bob, charlie, opfCollector, daemon] =
      await ethers.getSigners()
    // Fetch the smart contract before running tests
    Migration = await ethers.getContractFactory('V4Migration')
    ERC721Template = await ethers.getContractFactory('ERC721Template')
    ERC20Template = await ethers.getContractFactory('ERC20Template')
    ERC721Factory = await ethers.getContractFactory('ERC721Factory')
    MigrationStaking = await ethers.getContractFactory('MigrationStaking')
    BPool = await ethers.getContractFactory('BPool')
    Router = await ethers.getContractFactory('FactoryRouter')
    dtPoolContract = await ethers.getContractAt('BPool', v3PoolAddress)

    dtPoolContract2 = await ethers.getContractAt('BPool', v3PoolAddress2)

    // DEPLOY ROUTER, SETTING OWNER
    poolTemplate = await BPool.deploy()
    router = await Router.deploy(
      deployer.address,
      oceanAddress,
      poolTemplate.address, // pool template field,
      opfCollector.address,
      []
    )
    // Deploy template contracts
    templateERC20 = await ERC20Template.deploy()
    templateERC721 = await ERC721Template.deploy()
    // Deploy ERC721 Token Factory
    factoryERC721 = await ERC721Factory.deploy(
      templateERC721.address,
      templateERC20.address,
      opfCollector.address,
      router.address
    )
    // Deploy migration contract
    migration = await Migration.deploy(
      factoryERC721.address,
      oceanAddress,
      poolTemplate.address,
      daemon.address
    )
    // Deploy migration staking (used for set up the pool)
    migrationStaking = await MigrationStaking.deploy(
      router.address,
      migration.address
    )

    // SET REQUIRED ADDRESS
    await router.addFactory(factoryERC721.address)

    // we add the MigrationStaking as a normal ssContract
    await router.addSSContract(migrationStaking.address)

    // we also set the contract address into migration contract (onlyOwner)
    await migration.addMigrationStaking(migrationStaking.address)
  })

  describe('deployment', async () => {
    it('V4Migration contract deployed successfully', async () => {
      const address = migration.address
      // Test the smart contract has been deployed with a valid address
      assert.notEqual(address, 0x0)
      assert.notEqual(address, '')
      assert.notEqual(address, null)
      assert.notEqual(address, undefined)
    })
    it('ERC721Template contract deployed successfully', async () => {
      const address = templateERC721.address
      // Test the smart contract has been deployed with a valid address
      assert.notEqual(address, 0x0)
      assert.notEqual(address, '')
      assert.notEqual(address, null)
      assert.notEqual(address, undefined)
    })
    it('ERC20template contract deployed successfully', async () => {
      const address = templateERC20.address
      // Test the smart contract has been deployed with a valid address
      assert.notEqual(address, 0x0)
      assert.notEqual(address, '')
      assert.notEqual(address, null)
      assert.notEqual(address, undefined)
    })
    it('poolTemplate contract deployed successfully', async () => {
      const address = poolTemplate.address
      // Test the smart contract has been deployed with a valid address
      assert.notEqual(address, 0x0)
      assert.notEqual(address, '')
      assert.notEqual(address, null)
      assert.notEqual(address, undefined)
    })
    it('router contract deployed successfully', async () => {
      const address = router.address
      // Test the smart contract has been deployed with a valid address
      assert.notEqual(address, 0x0)
      assert.notEqual(address, '')
      assert.notEqual(address, null)
      assert.notEqual(address, undefined)
    })
  })

  describe('Ownership', async () => {
    it('Contract has the correct owner', async () => {
      const owner = await migration.owner()
      expect(owner).to.equal(deployer.address)
    })
  })

  describe('Migration has not started,status == notStarted', async () => {
    it('#startMigration - Migration successfully reverts if caller is not the datatoken publisher.', async () => {
      await expectRevert(
        migration.startMigration(
          v3Datatoken,
          v3PoolAddress,
          didV3,
          tokenURI,
          [nftName, nftSymbol],
          [erc20Name, erc20Symbol]
        ),
        'Caller is not the datatoken publisher'
      )
    })
    it('#addShares - adding shares reverts if the migration process has not been allowed by the publisher.', async () => {
      await expectRevert(
        migration.addShares(v3PoolAddress, 100),
        'Adding shares is not currently allowed'
      )
    })
    it('#removeShares - removing shares successfully reverts if the migration process has not been allowed by the publisher.', async () => {
      await expectRevert(
        migration.removeShares(v3PoolAddress, 100),
        'Current pool status does not allow share removal'
      )
    })
    it('#thrsholdMet - should return false if NO LPT LOCKED', async () => {
      expect(await migration.thresholdMet(v3PoolAddress)).to.equal(false)
    })
    it('#cancelMigration - should fail to call if not Contract owner or v3DTOwner', async () => {
      await expectRevert(
        migration.connect(bob).cancelMigration(v3PoolAddress),
        'Not OPF or DT owner'
      )
    })

    it('#cancelMigration - should fail to call if status != allowed (in this case notStarted)', async () => {
      await expectRevert(
        migration.cancelMigration(v3PoolAddress),
        'Current pool status does not allow to cancel Pool'
      )
    })
    it('#liquidateAndCreatePool - should fail to call if status != allowed', async () => {
      await expectRevert(
        migration
          .connect(bob)
          .liquidateAndCreatePool(v3PoolAddress, [
            web3.utils.toWei('1'),
            web3.utils.toWei('1')
          ]),
        'Current pool status does not allow to liquidate Pool'
      )
    })
    it('#setMetadataAndTransferNFT - daemon should fail to call if status != migrated', async () => {
      await expectRevert(
        migration
          .connect(daemon)
          .setMetadataAndTransferNFT(
            v3PoolAddress2,
            metaDataState,
            metaDataDecryptorUrlAndAddress,
            flagsAndData,
            metadataHash,
            didV4
          ),
        'Migration not completed yet'
      )
    })
    it('#setMetadataAndTransferNFT - user should fail to call if NOT daemon', async () => {
      await expectRevert(
        migration
          .connect(bob)
          .setMetadataAndTransferNFT(
            v3PoolAddress2,
            metaDataState,
            metaDataDecryptorUrlAndAddress,
            flagsAndData,
            metadataHash,
            didV4
          ),
        'ONLY OPF DAEMON'
      )
    })
    it('#getPoolStatus - should return default values', async () => {
      const poolStatus = await migration.getPoolStatus(v3PoolAddress)

      expect(poolStatus.status).to.equal(0)
      expect(poolStatus.poolV3Address).to.equal(addressZero)
      expect(poolStatus.poolV4Address).to.equal(addressZero)
      expect(poolStatus.didV3).to.equal('')
      expect(poolStatus.didV4).to.equal('')
      expect(poolStatus.dtV3Address).to.equal(addressZero)
      expect(poolStatus.totalOcean).to.equal(0)
      expect(poolStatus.totalDTBurnt).to.equal(0)
      expect(poolStatus.newLPTAmount).to.equal(0)
      expect(poolStatus.lptRounding).to.equal(0)
      expect(poolStatus.deadline).to.equal(0)
    })
    it('#getTokensDetails- should return default values', async () => {
      const tokensDetails = await migration.getTokensDetails(v3PoolAddress)

      expect(tokensDetails.erc721Address).to.equal(addressZero)
      expect(tokensDetails.dtV4Address).to.equal(addressZero)
      expect(tokensDetails.nftName).to.equal('')
      expect(tokensDetails.nftSymbol).to.equal('')
      expect(tokensDetails.tokenURI).to.equal('')
      expect(tokensDetails.erc20Name).to.equal('')
      expect(tokensDetails.erc20Symbol).to.equal('')
    })
    it('#getSharesAllocation- should return default values for any user', async () => {
      sharesAllocation = await migration.getShareAllocation(
        v3PoolAddress,
        bob.address
      )

      expect(sharesAllocation.userV3Shares).to.equal(0)
      expect(sharesAllocation.userV4Shares).to.equal(0)
      expect(sharesAllocation.alreadyAdded).to.equal(false)

      sharesAllocation = await migration.getShareAllocation(
        v3PoolAddress,
        v3DTOwner
      )

      expect(sharesAllocation.userV3Shares).to.equal(0)
      expect(sharesAllocation.userV4Shares).to.equal(0)
      expect(sharesAllocation.alreadyAdded).to.equal(false)
    })

    it('#addMigrationStaking- should fail to set staking address if not Contract Owner', async () => {
      await expectRevert(
        migration.connect(bob).addMigrationStaking(alice.address),
        'Ownable: caller is not the owner'
      )
    })
  })
  describe('Migration has started, status == allowed', async () => {
    it('Migration started', async () => {
      await impersonate(v3DTOwner)
      signer = ethers.provider.getSigner(v3DTOwner)

      const txReceipt = await (
        await migration
          .connect(signer)
          .startMigration(
            v3Datatoken,
            v3PoolAddress,
            didV3,
            tokenURI,
            [nftName, nftSymbol],
            [erc20Name, erc20Symbol]
          )
      ).wait()

      expect(txReceipt.events[0].event === 'Started')
      poolStatus = await migration.getPoolStatus(v3PoolAddress)
      // console.log(poolStatus)
      expect(poolStatus.status).to.equal(1)
      expect(poolStatus.poolV3Address).to.equal(v3PoolAddress)
      expect(poolStatus.didV3).to.equal(didV3)
      expect(poolStatus.didV4).to.equal('')
      expect(poolStatus.owner).to.equal(v3DTOwner)
      expect(poolStatus.poolV4Address).to.equal(addressZero)
      expect(poolStatus.dtV3Address).to.equal(v3Datatoken)
      expect(poolStatus.poolShareOwners.length).to.equal(0)
      expect(poolStatus.totalOcean).to.equal(0)
      expect(poolStatus.totalDTBurnt).to.equal(0)
      expect(poolStatus.newLPTAmount).to.equal(0)
      expect(poolStatus.lptRounding).to.equal(0)
    })

    it('#startMigration - reverts if has already started.', async () => {
      await expectRevert(
        migration
          .connect(signer)
          .startMigration(
            v3Datatoken,
            v3PoolAddress,
            didV3,
            tokenURI,
            [nftName, nftSymbol],
            [erc20Name, erc20Symbol]
          ),
        'Migration process has already been started'
      )
    })
    // In this part we are going to unit test with threshold not met
    it('#addShares - adding shares successfully add shares if approved', async () => {
      const noOfShares = 100
      const initialShares = await dtPoolContract.balanceOf(signer._address)

      await dtPoolContract
        .connect(signer)
        .approve(migration.address, noOfShares)

      await migration.connect(signer).addShares(v3PoolAddress, noOfShares)
      // Get current share allocation
      const shareAllocation = await migration.getShareAllocation(
        v3PoolAddress,
        signer._address
      )

      expect(await dtPoolContract.balanceOf(signer._address)).to.equal(
        initialShares.sub(shareAllocation.userV3Shares)
      )
      expect(shareAllocation.userV3Shares).to.equal(noOfShares)
    })

    it('#removeShares - reverts when user requests removal of more shares than they have added.', async () => {
      const noOfShares = 100
      expect(noOfShares).to.equal(
        (await migration.getShareAllocation(v3PoolAddress, signer._address))
          .userV3Shares
      )
      signer = ethers.provider.getSigner(v3DTOwner)

      await expectRevert(
        migration.connect(signer).removeShares(v3PoolAddress, noOfShares + 10),
        'User does not have sufficient shares locked up'
      )
    })
    it('#removeShares - should remove shares if deadline has not passed.', async () => {
      expect((await migration.getPoolStatus(v3PoolAddress)).deadline).gt(
        await ethers.provider.getBlockNumber()
      )
      await migration.connect(signer).removeShares(v3PoolAddress, 100)

      expect(
        (await migration.getShareAllocation(v3PoolAddress, v3DTOwner))
          .userV3Shares
      ).to.equal(0)
    })
    it('#thresholdMet - should return false for 0 LPT LOCKED', async () => {
      expect(await migration.thresholdMet(v3PoolAddress)).to.equal(false)
    })
    it('#cancelMigration - should fail to call if not Contract owner or v3DTOwner', async () => {
      await expectRevert(
        migration.connect(bob).cancelMigration(v3PoolAddress),
        'Not OPF or DT owner'
      )
    })

    it('#cancelMigration - should succeed to cancel if threshold not met and status == allowed', async () => {
      poolStatus = await migration.getPoolStatus(v3PoolAddress)
      expect((await migration.getPoolStatus(v3PoolAddress)).status).to.equal(1)
      await migration.cancelMigration(v3PoolAddress)
      expect((await migration.getPoolStatus(v3PoolAddress)).status).to.equal(0)
    })
    it('#liquidateAndCreatePool - should fail to call if status != allowed', async () => {
      await expectRevert(
        migration
          .connect(bob)
          .liquidateAndCreatePool(v3PoolAddress, [
            web3.utils.toWei('1'),
            web3.utils.toWei('1')
          ]),
        'Current pool status does not allow to liquidate Pool'
      )
    })

    it('#getPoolStatus - should return default values now that we cancelled it', async () => {
      const poolStatus = await migration.getPoolStatus(v3PoolAddress)

      expect(poolStatus.status).to.equal(0)
      expect(poolStatus.poolV3Address).to.equal(addressZero)
      expect(poolStatus.poolV4Address).to.equal(addressZero)
      expect(poolStatus.didV3).to.equal('')
      expect(poolStatus.didV4).to.equal('')
      expect(poolStatus.dtV3Address).to.equal(addressZero)
      expect(poolStatus.totalOcean).to.equal(0)
      expect(poolStatus.totalDTBurnt).to.equal(0)
      expect(poolStatus.newLPTAmount).to.equal(0)
      expect(poolStatus.lptRounding).to.equal(0)
      expect(poolStatus.deadline).to.equal(0)
    })
    it('#getTokensDetails- should return default values', async () => {
      const tokensDetails = await migration.getTokensDetails(v3PoolAddress)

      expect(tokensDetails.erc721Address).to.equal(addressZero)
      expect(tokensDetails.dtV4Address).to.equal(addressZero)
      expect(tokensDetails.nftName).to.equal('')
      expect(tokensDetails.nftSymbol).to.equal('')
      expect(tokensDetails.tokenURI).to.equal('')
      expect(tokensDetails.erc20Name).to.equal('')
      expect(tokensDetails.erc20Symbol).to.equal('')
    })
    it('#getSharesAllocation- should return default values for any user', async () => {
      sharesAllocation = await migration.getShareAllocation(
        v3PoolAddress,
        bob.address
      )

      expect(sharesAllocation.userV3Shares).to.equal(0)
      expect(sharesAllocation.userV4Shares).to.equal(0)
      expect(sharesAllocation.alreadyAdded).to.equal(false)

      sharesAllocation = await migration.getShareAllocation(
        v3PoolAddress,
        v3DTOwner
      )

      expect(sharesAllocation.userV3Shares).to.equal(0)
      expect(sharesAllocation.userV4Shares).to.equal(0)
      expect(sharesAllocation.alreadyAdded).to.equal(false)
    })

    it('Migration successfully restarts', async () => {
      await impersonate(v3DTOwner)
      signer = ethers.provider.getSigner(v3DTOwner)
      await migration
        .connect(signer)
        .startMigration(
          v3Datatoken,
          v3PoolAddress,
          didV3,
          tokenURI,
          [nftName, nftSymbol],
          [erc20Name, erc20Symbol]
        )
      const poolStatus = await migration.getPoolStatus(v3PoolAddress)
      expect(poolStatus.status).to.equal(1)
      expect(poolStatus.poolV3Address).to.equal(v3PoolAddress)
      expect(poolStatus.didV3).to.equal(didV3)
    })

    // Now we add enough shares so we can unit test with threshold met
    it('#addShares - add enough share so threshold is met', async () => {
      const ownerShares = await dtPoolContract.balanceOf(signer._address)

      await dtPoolContract
        .connect(signer)
        .approve(migration.address, ownerShares)

      await migration.connect(signer).addShares(v3PoolAddress, ownerShares)

      // Get current share allocation
      const shareAllocation = await migration.getShareAllocation(
        v3PoolAddress,
        signer._address
      )

      expect(await dtPoolContract.balanceOf(signer._address)).to.equal(0)
      expect(shareAllocation.userV3Shares).to.equal(ownerShares)
      expect(await migration.thresholdMet(v3PoolAddress)).to.equal(true)
    })

    // A migration cannot be cancelled if threshold is MET (anytime but here tested before deadline)
    it('#cancelMigration - should fail to cancel if threshold is MET (before DEADLINE)', async () => {
      await expectRevert(
        migration.cancelMigration(v3PoolAddress),
        'Threshold already met'
      )
    })

    it('#liquidateAndCreatePool - should fail to call BEFORE deadline even if threshold is MET', async () => {
      await expectRevert(
        migration
          .connect(signer)
          .liquidateAndCreatePool(v3PoolAddress, [
            web3.utils.toWei('1'),
            web3.utils.toWei('1')
          ]),
        'Cannot be called before deadline'
      )
    })
    it('#setMetadataAndTransferNFT - daemon should fail to call if status != migrated', async () => {
      await expectRevert(
        migration
          .connect(daemon)
          .setMetadataAndTransferNFT(
            v3PoolAddress2,
            metaDataState,
            metaDataDecryptorUrlAndAddress,
            flagsAndData,
            metadataHash,
            didV4
          ),
        'Migration not completed yet'
      )
    })
    it('# check current states and advance blocks AFTER deadline', async () => {
      const poolStatus = await migration.getPoolStatus(v3PoolAddress)
      expect(poolStatus.status).to.equal(1)
      expect(poolStatus.poolV3Address).to.equal(v3PoolAddress)
      expect(poolStatus.didV3).to.equal(didV3)
      expect(await migration.thresholdMet(v3PoolAddress)).to.equal(true)
      expect((await migration.getPoolStatus(v3PoolAddress)).deadline).gt(
        await ethers.provider.getBlockNumber()
      )
      // we need to advance some block so we send some transactions
      for (let i = 0; i < 100; i++) {
        // each one advance a block
        await signer.sendTransaction({
          to: alice.address,
          value: ethers.utils.parseEther('0.0')
        })
      }
      // deadline has passed we can now liquidate anytime
      expect(await ethers.provider.getBlockNumber()).gt(
        (await migration.getPoolStatus(v3PoolAddress)).deadline
      )
    })
    it('#addShares - adding shares not allowed if DEADLINE has passed.', async () => {
      await expectRevert(
        migration.addShares(v3PoolAddress, 100),
        'Deadline reached for adding shares'
      )
    })
    it('#removeShares - removing shares not allowed if DEADLINE has passed.', async () => {
      await expectRevert(
        migration.removeShares(v3PoolAddress, 100),
        'Deadline reached for removing shares'
      )
    })
    // A migration cannot be cancelled if threshold is MET (anytime but here tested AFTER deadline)
    it('#cancelMigration - should fail to cancel if threshold is MET (AFTER deadline)', async () => {
      await expectRevert(
        migration.cancelMigration(v3PoolAddress),
        'Threshold already met'
      )
    })
    it('#liquidateAndCreatePool - we now liquidate the pool', async () => {
      const txReceipt = await (
        await migration
          .connect(signer)
          .liquidateAndCreatePool(v3PoolAddress, [
            web3.utils.toWei('1'),
            web3.utils.toWei('1')
          ])
      ).wait()

      const events = txReceipt.events.filter((e) => e.event === 'NewPool')

      const nftAddress = events[0].args.nftAddress
      const v4dtAddress = events[0].args.newDTAddress
      const newPoolAddress = events[0].args.newPool
      const v3DTAddress = events[0].args.v3DTAddress

      poolStatus = await migration.getPoolStatus(v3PoolAddress)
      const tokensDetails = await migration.getTokensDetails(v3PoolAddress)
      expect(v3DTAddress).to.equal(poolStatus.dtV3Address)
      expect(nftAddress).to.equal(tokensDetails.erc721Address)
      expect(v4dtAddress).to.equal(tokensDetails.dtV4Address)
      expect(newPoolAddress).to.equal(poolStatus.poolV4Address)
      // Pool has been migrated (index 2)
      expect(poolStatus.status).to.equal(2)

      newPool = await ethers.getContractAt(
        'contracts/interfaces/IERC20.sol:IERC20',
        newPoolAddress
      )
      oceanContract = await ethers.getContractAt(
        'contracts/interfaces/IERC20.sol:IERC20',
        oceanAddress
      )
      v4DT = await ethers.getContractAt(
        'contracts/interfaces/IERC20Template.sol:IERC20Template',
        v4dtAddress
      )
      nft = await ethers.getContractAt(
        'contracts/interfaces/IERC721Template.sol:IERC721Template',
        nftAddress
      )

      v3DT = await ethers.getContractAt(
        'contracts/interfaces/IERC20Template.sol:IERC20Template',
        v3Datatoken
      )

      // NFT is still in the Migration contract
      expect(await nft.ownerOf(1)).to.equal(migration.address)

      // v3DT owner hasn't received any v4 dts
      expect(await v4DT.balanceOf(v3DTOwner)).to.equal(0)
      // NO OCEAN, nor v3 dts stay in the migrationStaking

      expect(await oceanContract.balanceOf(migrationStaking.address)).to.equal(
        0
      )
      expect(await v3DT.balanceOf(migrationStaking.address)).to.equal(0)

      // max cap is minted into the migrationStaking,
      // balance in migrationStaking is cap minus what we added in the pool
      expect(await v4DT.balanceOf(migrationStaking.address)).to.equal(
        (await v4DT.cap()).sub(await v4DT.balanceOf(newPoolAddress))
      )

      // NO OCEAN, nor v3 or v4 dt stay in migration
      expect(await v4DT.balanceOf(migration.address)).to.equal(0)
      expect(await oceanContract.balanceOf(migration.address)).to.equal(0)
      expect(await v3DT.balanceOf(migration.address)).to.equal(0)
      // v3DTs were sent to the address(1)
      expect(await v3DT.balanceOf(addressOne)).to.equal(poolStatus.totalDTBurnt)
      // same amount of token burnt in address one to equal new v4dt balance in pool
      // Both all the new dts and all oceans are in the pool
      expect(await v4DT.balanceOf(newPoolAddress)).to.equal(
        poolStatus.totalDTBurnt
      )
      expect(await oceanContract.balanceOf(newPoolAddress)).to.equal(
        poolStatus.totalOcean
      )

      // total new LPT amount is equal to the sum of the LP PROVIDERS + what might be left in the migration contract
      expect(poolStatus.newLPTAmount).to.equal(
        (await newPool.balanceOf(v3DTOwner)).add(
          await newPool.balanceOf(migration.address)
        )
      )

      // check we stored the information properly
      expect(
        (await migration.getShareAllocation(v3PoolAddress, v3DTOwner))
          .userV4Shares
      ).to.equal(await newPool.balanceOf(v3DTOwner))
    })

    it('#addShares - adding shares not allowed if status != allowed.', async () => {
      // Pool has been migrated (index 2)
      expect(poolStatus.status).to.equal(2)
      await expectRevert(
        migration.addShares(v3PoolAddress, 100),
        'Adding shares is not currently allowed'
      )
    })
    it('#removeShares - removing shares not allowed if status != allowed.', async () => {
      // Pool has been migrated (index 2)
      expect(poolStatus.status).to.equal(2)
      await expectRevert(
        migration.removeShares(v3PoolAddress, 100),
        'Current pool status does not allow share removal'
      )
    })
    // A migration cannot be cancelled if threshold is MET (anytime but here tested AFTER deadline)
    it('#cancelMigration - should fail to cancel if threshold is MET (AFTER deadline)', async () => {
      await expectRevert(
        migration.cancelMigration(v3PoolAddress),
        'Current pool status does not allow to cancel Pool'
      )
    })

    it('#liquidateAndCreatePool - should fail to call AGAIN ', async () => {
      await expectRevert(
        migration
          .connect(signer)
          .liquidateAndCreatePool(v3PoolAddress, [
            web3.utils.toWei('1'),
            web3.utils.toWei('1')
          ]),
        'Current pool status does not allow to liquidate Pool'
      )
    })
  })
  describe('Pool has been created, v4 lpts sent and v3 dts burnt,status == migrated', async () => {
    it('#startMigration - reverts if status != notStarted.', async () => {
      await expectRevert(
        migration
          .connect(signer)
          .startMigration(
            v3Datatoken,
            v3PoolAddress,
            didV3,
            tokenURI,
            [nftName, nftSymbol],
            [erc20Name, erc20Symbol]
          ),
        'Migration process has already been started'
      )
    })
    it('#addShares - adding shares not allowed if status != allowed.', async () => {
      // Pool has been migrated (index 2)
      expect(poolStatus.status).to.equal(2)
      await expectRevert(
        migration.addShares(v3PoolAddress, 100),
        'Adding shares is not currently allowed'
      )
    })
    it('#removeShares - removing shares not allowed if status != allowed.', async () => {
      // Pool has been migrated (index 2)
      expect(poolStatus.status).to.equal(2)
      await expectRevert(
        migration.removeShares(v3PoolAddress, 100),
        'Current pool status does not allow share removal'
      )
    })

    it('#cancelMigration - should fail to call if already migrated', async () => {
      await expectRevert(
        migration.cancelMigration(v3PoolAddress),
        'Current pool status does not allow to cancel Pool'
      )
    })

    it('#liquidateAndCreatePool - should fail to call again if already migrated', async () => {
      await expectRevert(
        migration
          .connect(signer)
          .liquidateAndCreatePool(v3PoolAddress, [
            web3.utils.toWei('1'),
            web3.utils.toWei('1')
          ]),
        'Current pool status does not allow to liquidate Pool'
      )
    })

    it('#setMetadataAndTransferNFT - daemon should SUCCEED to call if status == migrated', async () => {
      // Pool has been migrated (index 2)
      expect(poolStatus.status).to.equal(2)
      const txReceipt = await (
        await migration
          .connect(daemon)
          .setMetadataAndTransferNFT(
            v3PoolAddress,
            metaDataState,
            metaDataDecryptorUrlAndAddress,
            flagsAndData,
            metadataHash,
            didV4
          )
      ).wait()

      const events = txReceipt.events.filter((e) => e.event === 'Completed')
      expect(events[0].args.poolAddress).to.equal(v3PoolAddress)
      // Pool migration has been completed (index 3)
      expect(events[0].args.status).to.equal(3)

      // NFT has been transferred to the owner
      expect(await nft.ownerOf(1)).to.equal(v3DTOwner)
    })
    describe('Migration is completed, Metadata is SET and NFT transferred to V3DTOwner', async () => {
      it('#startMigration - reverts if status != notStarted.', async () => {
        await expectRevert(
          migration
            .connect(signer)
            .startMigration(
              v3Datatoken,
              v3PoolAddress,
              didV3,
              tokenURI,
              [nftName, nftSymbol],
              [erc20Name, erc20Symbol]
            ),
          'Migration process has already been started'
        )
      })
      it('#addShares - adding shares not allowed if status != allowed.', async () => {
        // Pool has been migrated (index 2)
        expect(poolStatus.status).to.equal(2)
        await expectRevert(
          migration.addShares(v3PoolAddress, 100),
          'Adding shares is not currently allowed'
        )
      })
      it('#removeShares - removing shares not allowed if status != allowed.', async () => {
        // Pool has been migrated (index 2)
        expect(poolStatus.status).to.equal(2)
        await expectRevert(
          migration.removeShares(v3PoolAddress, 100),
          'Current pool status does not allow share removal'
        )
      })

      it('#cancelMigration - should fail to call if already completed', async () => {
        await expectRevert(
          migration.cancelMigration(v3PoolAddress),
          'Current pool status does not allow to cancel Pool'
        )
      })

      it('#liquidateAndCreatePool - should fail to call again if already completed', async () => {
        await expectRevert(
          migration
            .connect(signer)
            .liquidateAndCreatePool(v3PoolAddress, [
              web3.utils.toWei('1'),
              web3.utils.toWei('1')
            ]),
          'Current pool status does not allow to liquidate Pool'
        )
      })
    })
  })
})
