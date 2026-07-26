// SPDX-License-Identifier: MIT
pragma solidity 0.8.35;

/// @notice Educational simulation of an airdrop-farming "points" protocol
/// (testnet learning project, no real value — see SPEC.md).
/// @dev checkIn()/completeTask() are gated on msg.sender (proof-of-activity
/// by a specific wallet) — unlike MerkleAirdrop.claim(), which takes
/// `account` as a parameter because a merkle proof gates it instead.
contract PointsProtocol {
    uint256 public constant CHECK_IN_INTERVAL = 1 days;
    uint256 public constant CHECK_IN_POINTS = 10;
    uint256 public constant TASK_POINTS = 25;
    uint256 public constant TASK_COUNT = 5; // valid taskId range: [0, TASK_COUNT)

    mapping(address => uint256) public points;
    mapping(address => uint256) public lastCheckIn;
    mapping(address => mapping(uint256 => bool)) public hasCompletedTask;

    event CheckedIn(address indexed account, uint256 newTotalPoints, uint256 timestamp);
    event TaskCompleted(address indexed account, uint256 indexed taskId, uint256 newTotalPoints);

    error CheckInTooSoon(uint256 nextCheckInTime);
    error InvalidTaskId();
    error TaskAlreadyCompleted();

    /// @notice Claim today's check-in points. Reverts if called again before
    /// CHECK_IN_INTERVAL has elapsed since the caller's last check-in.
    function checkIn() external {
        uint256 last = lastCheckIn[msg.sender];
        if (last != 0 && block.timestamp < last + CHECK_IN_INTERVAL) {
            revert CheckInTooSoon(last + CHECK_IN_INTERVAL);
        }

        lastCheckIn[msg.sender] = block.timestamp;
        points[msg.sender] += CHECK_IN_POINTS;

        emit CheckedIn(msg.sender, points[msg.sender], block.timestamp);
    }

    /// @notice Complete one of a fixed set of tasks, once per address per taskId.
    function completeTask(uint256 taskId) external {
        if (taskId >= TASK_COUNT) revert InvalidTaskId();
        if (hasCompletedTask[msg.sender][taskId]) revert TaskAlreadyCompleted();

        hasCompletedTask[msg.sender][taskId] = true;
        points[msg.sender] += TASK_POINTS;

        emit TaskCompleted(msg.sender, taskId, points[msg.sender]);
    }
}
