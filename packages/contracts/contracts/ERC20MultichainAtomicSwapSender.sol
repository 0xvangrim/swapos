// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.8;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import 'hardhat/console.sol';
import { Router } from "@hyperlane-xyz/core/contracts/Router.sol";
import { TypeCasts } from "@hyperlane-xyz/core/contracts/libs/TypeCasts.sol";
import { SwapMessage } from "./util/SwapMessage.sol";

/**
 * Splits the ERC20AtomicSwap to be able to communicate with another instance of itself.
 */
contract ERC20MultichainAtomicSwapSender is Router {
  using TypeCasts for bytes32;
  using TypeCasts for address;
  using SwapMessage for bytes;

  event HTLCERC20Created(
    bytes32 indexed htlcId,
    address indexed sender,
    address senderToken,
    address receiverToken,
    uint32 receiverDomain
  );
  event HTLCERC20Withdrawn(bytes32 indexed htlcId);
  event HTLCERC20Refunded(bytes32 indexed htlcId);

  struct HTLCContract {
    address sender;
    address senderToken;
    uint256 senderAmount;

    address receiver;
    uint32 receiverDomain;
    address receiverToken;
    uint256 receiverAmount;
    
    uint256 timelock;
    bool withdrawn;
    bool refunded;
  }

  mapping(bytes32 => HTLCContract) htlcs;
  uint32 senderDomain;

  modifier tokensTransferable(
    address _token,
    address _sender,
    uint256 _amount
  ) {
    require(_amount > 0, 'tokensTransferable: token amount must be > 0');
    require(
      ERC20(_token).allowance(_sender, address(this)) >= _amount,
      'tokensTransferable: token allowance must be >= amount'
    );
    _;
  }

  modifier futureTimelock(uint256 _timelock) {
    // only requirement is the timelock time is after the last blocktime (now).
    // probably want something a bit further in the future then this.
    // but this is still a useful sanity check:
    require(_timelock > block.timestamp, 'futureTimelock: timelock time must be in the future');
    _;
  }

  modifier contractExists(bytes32 _htlcId) {
    require(haveHTLC(_htlcId), 'contractExists: htlcId does not exist');
    _;
  }

  modifier tokenAmountValid(uint256 _amount) {
    require(_amount > 0, 'tokenAmountValid: token amount must be > 0');
    _;
  }

  modifier withdrawable(bytes32 _htlcId) {
    require(htlcs[_htlcId].withdrawn == false, 'withdrawable: already withdrawn');
    // This check needs to be added if claims are allowed after timeout. That is, if the following timelock check is commented out
    // require(htlcs[_htlcId].refunded == false, 'withdrawable: already refunded');
    // if we want to disallow claim to be made after the timeout, uncomment the following line
    require(htlcs[_htlcId].timelock > block.timestamp, "withdrawable: timelock expired");
    _;
  }

  modifier refundable(bytes32 _htlcId) {
    require(htlcs[_htlcId].sender == msg.sender, 'refundable: not sender');
    require(htlcs[_htlcId].refunded == false, 'refundable: already refunded');
    require(htlcs[_htlcId].withdrawn == false, 'refundable: already withdrawn');
    require(
      htlcs[_htlcId].timelock <= block.timestamp,
      'refundable: timelock not yet passed'
    );
    _;
  }

  function initialize(
    address _connectionManager,
    address _interchainGasPaymaster,
    uint32 _senderDomain
  ) external initializer {
      // transfers ownership to `msg.sender`
      __AbacusConnectionClient_initialize(
          _connectionManager,
          _interchainGasPaymaster
      );
      senderDomain = _senderDomain;
  }

  function newContract(
    uint256 _timelock,
    address _senderToken,
    uint256 _senderAmount,
    uint32 _receiverDomain,
    address _receiverToken,
    uint256 _receiverAmount
  )
    external
    tokenAmountValid(_receiverAmount)
    tokensTransferable(_senderToken, msg.sender, _senderAmount)
    futureTimelock(_timelock)
    returns (bytes32 htlcId)
  {
htlcId = _getHtlcId(
      _getSenderHash(msg.sender, senderDomain, _senderToken, _senderAmount), 
      _getReceiverHash(_receiverDomain, _receiverToken, _receiverAmount),
      _timelock
    );

    // Reject if a contract already exists with the same parameters. The
    // sender must change one of these parameters.
    if (haveHTLC(htlcId)) revert('newContract: Contract already exists');

    // This contract becomes the temporary owner of the tokens
    if (!ERC20(_senderToken).transferFrom(msg.sender, address(this), _senderAmount))
      revert('transferFrom sender to this failed');

    htlcs[htlcId] = HTLCContract(
      msg.sender,
      _senderToken,
      _senderAmount,
      address(0),
      _receiverDomain,
      _receiverToken,
      _receiverAmount,
      _timelock,
      false,
      false
    );

    emit HTLCERC20Created(
      htlcId,
      msg.sender,
      _senderToken,
      _receiverToken,
      _receiverDomain
    );
  }

  function refund(bytes32 _htlcId)
    external
    contractExists(_htlcId)
    refundable(_htlcId)
    returns (bool)
  {
    HTLCContract storage c = htlcs[_htlcId];
    c.refunded = true;
    ERC20(c.senderToken).transfer(c.sender, c.senderAmount);

    emit HTLCERC20Refunded(_htlcId);
    return true;
  }

  function _withdraw(
    bytes32 _htlcId,
    address receiver
  ) internal returns (bool) {
    HTLCContract storage c = htlcs[_htlcId];
    c.receiver = receiver;
    c.withdrawn = true;
    ERC20(c.senderToken).transfer(receiver, c.senderAmount);

    _dispatchWithGas(
      c.receiverDomain,
      SwapMessage.format(_htlcId, c.sender.addressToBytes32()),
      msg.value
    );
    
    emit HTLCERC20Withdrawn(_htlcId);
    return true;
  }

  function getHTLC(bytes32 _htlcId)
    public
    view
    returns (
      address sender,
      address senderToken,
      uint256 senderAmount,
      address receiver,
      uint32 receiverDomain,
      address receiverToken,
      uint256 receiverAmount,
      uint256 timelock,
      bool withdrawn,
      bool refunded
    )
  {
    if (haveHTLC(_htlcId) == false)
      return (address(0), address(0), 0, address(0), 0, address(0), 0, 0, false, false);
    HTLCContract storage c = htlcs[_htlcId];
    return (
      c.sender,
      c.senderToken,
      c.senderAmount,
      c.receiver,
      c.receiverDomain,
      c.receiverToken,
      c.receiverAmount,
      c.timelock,
      c.withdrawn,
      c.refunded
    );
  }

  function haveHTLC(bytes32 _htlcId) internal view returns (bool exists) {
    exists = (htlcs[_htlcId].sender != address(0));
  }

  function getDomain() public view returns (uint32 _senderDomain) {
    _senderDomain = senderDomain;
  }
  
  function _handle(
    uint32 origin,
    bytes32,
    bytes calldata _message
  ) internal override {
    address recipient = _message.recipient().bytes32ToAddress();
    bytes32 htlcId = _message.htlcId();

    require(haveHTLC(htlcId), '_handle: htlcId does not exist');
    require(htlcs[htlcId].receiverDomain == origin, '_handle: called from the incorrect chain');
    require(htlcs[htlcId].withdrawn == false, '_handle: already withdrawn');
    require(htlcs[htlcId].refunded == false, '_handle: already refunded');

    _withdraw(htlcId, recipient);
  }

  function _getSenderHash(
    address _sender,
    uint32 _senderDomain,
    address _senderToken,
    uint256 _senderAmount
  ) internal pure returns (bytes32 hash) {
    hash = keccak256(abi.encodePacked(_sender, _senderDomain, _senderToken, _senderAmount));
  }

  function _getReceiverHash(
    uint32 _receiverDomain,
    address _receiverToken,
    uint256 _receiverAmount
  ) internal pure returns (bytes32 hash) {
    hash = keccak256(abi.encodePacked(_receiverDomain, _receiverToken, _receiverAmount));
  }

  function _getHtlcId(
    bytes32 _senderHash,
    bytes32 _receiverHash,
    uint256 _timelock
  ) internal pure returns (bytes32 hash) {
    hash = keccak256(abi.encodePacked(_senderHash, _receiverHash, _timelock));
  }
}
