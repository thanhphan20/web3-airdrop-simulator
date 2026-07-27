// SPDX-License-Identifier: MIT
pragma solidity 0.8.35;

import {Test} from "forge-std/Test.sol";
import {PointsProtocol} from "../src/PointsProtocol.sol";

contract PointsProtocolTest is Test {
    PointsProtocol pointsProtocol;

    address constant ALICE = address(0xA11CE);
    address constant BOB = address(0xB0B);

    function setUp() public {
        pointsProtocol = new PointsProtocol();
        vm.warp(1_700_000_000); // arbitrary non-zero starting timestamp
    }

    function test_CheckIn_AwardsPoints() public {
        vm.prank(ALICE);
        pointsProtocol.checkIn();
        assertEq(pointsProtocol.points(ALICE), pointsProtocol.CHECK_IN_POINTS());
    }

    function test_CheckIn_SetsLastCheckInTimestamp() public {
        vm.prank(ALICE);
        pointsProtocol.checkIn();
        assertEq(pointsProtocol.lastCheckIn(ALICE), block.timestamp);
    }

    function test_CheckIn_EmitsCheckedInEvent() public {
        vm.expectEmit(true, false, false, true, address(pointsProtocol));
        emit PointsProtocol.CheckedIn(ALICE, pointsProtocol.CHECK_IN_POINTS(), block.timestamp);

        vm.prank(ALICE);
        pointsProtocol.checkIn();
    }

    function test_RevertWhen_CheckInTooSoon() public {
        vm.startPrank(ALICE);
        pointsProtocol.checkIn();

        vm.expectRevert(
            abi.encodeWithSelector(
                PointsProtocol.CheckInTooSoon.selector, block.timestamp + pointsProtocol.CHECK_IN_INTERVAL()
            )
        );
        pointsProtocol.checkIn();
        vm.stopPrank();
    }

    function test_RevertWhen_CheckInBeforeIntervalElapses() public {
        vm.startPrank(ALICE);
        pointsProtocol.checkIn();
        vm.warp(block.timestamp + 12 hours);

        vm.expectPartialRevert(PointsProtocol.CheckInTooSoon.selector);
        pointsProtocol.checkIn();
        vm.stopPrank();
    }

    function test_CheckIn_SucceedsAfterIntervalElapsed() public {
        vm.startPrank(ALICE);
        pointsProtocol.checkIn();
        vm.warp(block.timestamp + pointsProtocol.CHECK_IN_INTERVAL() + 1);
        pointsProtocol.checkIn();
        vm.stopPrank();

        assertEq(pointsProtocol.points(ALICE), 2 * pointsProtocol.CHECK_IN_POINTS());
    }

    function test_CheckIn_SucceedsExactlyAtIntervalBoundary() public {
        vm.startPrank(ALICE);
        pointsProtocol.checkIn();
        vm.warp(block.timestamp + pointsProtocol.CHECK_IN_INTERVAL());
        pointsProtocol.checkIn();
        vm.stopPrank();

        assertEq(pointsProtocol.points(ALICE), 2 * pointsProtocol.CHECK_IN_POINTS());
    }

    function test_CompleteTask_AwardsPoints() public {
        vm.prank(ALICE);
        pointsProtocol.completeTask(0);
        assertEq(pointsProtocol.points(ALICE), pointsProtocol.TASK_POINTS());
    }

    function test_CompleteTask_EmitsTaskCompletedEvent() public {
        vm.expectEmit(true, true, false, true, address(pointsProtocol));
        emit PointsProtocol.TaskCompleted(ALICE, 0, pointsProtocol.TASK_POINTS());

        vm.prank(ALICE);
        pointsProtocol.completeTask(0);
    }

    function test_CompleteTask_MarksTaskCompleted() public {
        vm.prank(ALICE);
        pointsProtocol.completeTask(0);
        assertTrue(pointsProtocol.hasCompletedTask(ALICE, 0));
    }

    function test_RevertWhen_TaskAlreadyCompleted() public {
        vm.startPrank(ALICE);
        pointsProtocol.completeTask(0);

        vm.expectRevert(PointsProtocol.TaskAlreadyCompleted.selector);
        pointsProtocol.completeTask(0);
        vm.stopPrank();
    }

    function test_RevertWhen_InvalidTaskId() public {
        uint256 invalidTaskId = pointsProtocol.TASK_COUNT();

        vm.prank(ALICE);
        vm.expectRevert(PointsProtocol.InvalidTaskId.selector);
        pointsProtocol.completeTask(invalidTaskId);
    }

    function test_CompleteTask_AllowsCompletingAllDistinctTasks() public {
        vm.startPrank(ALICE);
        uint256 taskCount = pointsProtocol.TASK_COUNT();
        for (uint256 taskId = 0; taskId < taskCount; taskId++) {
            pointsProtocol.completeTask(taskId);
        }
        vm.stopPrank();

        assertEq(pointsProtocol.points(ALICE), taskCount * pointsProtocol.TASK_POINTS());
    }

    function test_CheckInAndCompleteTask_AccumulatePointsIndependently() public {
        vm.startPrank(ALICE);
        pointsProtocol.checkIn();
        pointsProtocol.completeTask(0);
        vm.stopPrank();

        assertEq(pointsProtocol.points(ALICE), pointsProtocol.CHECK_IN_POINTS() + pointsProtocol.TASK_POINTS());
    }

    function test_MultipleAccounts_TrackPointsAndCompletionSeparately() public {
        vm.startPrank(ALICE);
        pointsProtocol.checkIn();
        pointsProtocol.completeTask(0);
        vm.stopPrank();

        vm.prank(BOB);
        pointsProtocol.completeTask(1);

        assertEq(pointsProtocol.points(ALICE), pointsProtocol.CHECK_IN_POINTS() + pointsProtocol.TASK_POINTS());
        assertEq(pointsProtocol.points(BOB), pointsProtocol.TASK_POINTS());
        assertTrue(pointsProtocol.hasCompletedTask(ALICE, 0));
        assertFalse(pointsProtocol.hasCompletedTask(BOB, 0));
        assertTrue(pointsProtocol.hasCompletedTask(BOB, 1));
    }

    function testFuzz_CheckInAlwaysRevertsBeforeIntervalElapses(uint256 elapsed) public {
        elapsed = bound(elapsed, 0, pointsProtocol.CHECK_IN_INTERVAL() - 1);

        vm.startPrank(ALICE);
        pointsProtocol.checkIn();
        vm.warp(block.timestamp + elapsed);

        vm.expectPartialRevert(PointsProtocol.CheckInTooSoon.selector);
        pointsProtocol.checkIn();
        vm.stopPrank();
    }

    function testFuzz_InvalidTaskIdAlwaysReverts(uint256 taskId) public {
        taskId = bound(taskId, pointsProtocol.TASK_COUNT(), type(uint256).max);

        vm.prank(ALICE);
        vm.expectRevert(PointsProtocol.InvalidTaskId.selector);
        pointsProtocol.completeTask(taskId);
    }
}
