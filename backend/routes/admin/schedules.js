const express = require("express");
const router = express.Router();
const { authenticateToken, adminOnly } = require("../../middlewares/authMiddleware");
const ctrl = require("../../controllers/adminSchedulesController");

// 일정 목록 조회
router.get("/", authenticateToken, adminOnly, ctrl.listSchedules);

// 일정 유형 목록
router.get("/types", authenticateToken, adminOnly, ctrl.listScheduleTypes);

// 일정 단건 조회 (sessions 포함)
router.get("/:id", authenticateToken, adminOnly, ctrl.getScheduleById);

// 일정 등록
router.post("/", authenticateToken, adminOnly, ctrl.createSchedule);

// 일정 수정
router.put("/:id", authenticateToken, adminOnly, ctrl.updateSchedule);

// 일정 활성/비활성 토글
router.patch("/:id/active", authenticateToken, adminOnly, ctrl.toggleActive);

// 일정 일괄 삭제
router.delete("/", authenticateToken, adminOnly, ctrl.deleteSchedules);

// 일정 수강자 목록
router.get("/:id/students", authenticateToken, adminOnly, ctrl.getStudents);

module.exports = router;
