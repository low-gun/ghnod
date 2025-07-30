const bcrypt = require("bcryptjs");
const paymentModel = require("../models/payment.model");
const pool = require("../config/db");
const couponModel = require("../models/coupon.model");
const pointModel = require("../models/point.model");
const inquiryModel = require("../models/inquiry.model");
const userModel = require("../models/user.model");

exports.getUserInfo = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "로그인 필요" });

    const info = await userModel.getUserInfoById(userId);
    return res.status(200).json({ success: true, info });
  } catch (error) {
    console.error("❌ 유저 정보 조회 실패:", error);
    return res.status(500).json({ message: "내정보 조회 실패" });
  }
};

exports.updateUserInfo = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { username, phone, company, department, position, marketing_agree } =
      req.body;

    if (!userId) return res.status(401).json({ message: "로그인 필요" });
    if (!username || !phone) {
      return res.status(400).json({ message: "필수 항목이 누락되었습니다." });
    }

    await userModel.updateUserInfoById(
      userId,
      username,
      phone,
      company,
      department,
      position,
      marketing_agree
    );
    return res
      .status(200)
      .json({ success: true, message: "정보가 수정되었습니다." });
  } catch (error) {
    console.error("❌ 유저 정보 수정 실패:", error);
    return res.status(500).json({ message: "유저 정보 수정 실패" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, userId } = req.body;
    const isForcedReset = !!userId;
    const targetUserId = isForcedReset ? userId : req.user?.id;

    if (!targetUserId) return res.status(401).json({ message: "로그인 필요" });
    if (!newPassword || (!isForcedReset && !currentPassword)) {
      return res.status(400).json({ message: "필수 항목 누락" });
    }

    const user = await userModel.findUserById(targetUserId);
    if (!user) return res.status(404).json({ message: "사용자 없음" });

    if (!isForcedReset) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "현재 비밀번호가 일치하지 않습니다." });
      }
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await userModel.updatePassword(targetUserId, hashed);

    if (isForcedReset) {
      await userModel.clearPasswordResetFlag(targetUserId);
    }

    return res
      .status(200)
      .json({ success: true, message: "비밀번호가 변경되었습니다." });
  } catch (error) {
    console.error("❌ 비밀번호 변경 실패:", error);
    return res.status(500).json({ message: "비밀번호 변경 실패" });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "로그인 필요" });

    await userModel.softDeleteUser(userId);
    return res
      .status(200)
      .json({ success: true, message: "회원 탈퇴 처리되었습니다." });
  } catch (error) {
    console.error("❌ 탈퇴 처리 실패:", error);
    return res
      .status(500)
      .json({ message: "탈퇴 처리 중 오류가 발생했습니다." });
  }
};

exports.getCourseInfo = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "로그인 필요" });
    }

    // 파라미터 추출
    const {
      page = 1,
      pageSize = 10,
      searchType,
      searchValue,
      startDate,
      endDate,
    } = req.query;

    // 페이지네이션용 정수 변환
    const limit = Number.isNaN(Number(pageSize)) ? 10 : parseInt(pageSize, 10);
    const pageNum = Number.isNaN(Number(page)) ? 1 : parseInt(page, 10);
    const offset = (pageNum - 1) * limit;

    // 기본 WHERE 조건 (userId, order_status='paid')
    const values = [userId];
    let whereClause = `
      WHERE o.user_id = ?
        AND o.order_status = 'paid'
    `;

    // --------------------
    // 1) 검색 로직
    // --------------------
    // (A) 타이틀·장소·강사
    if (searchType && searchValue) {
      if (["title", "location", "instructor"].includes(searchType)) {
        whereClause += ` AND s.${searchType} LIKE ?`;
        values.push(`%${searchValue}%`);
      }
    }

    // (B) 날짜 검색
    if (searchType === "date") {
      if (startDate) {
        whereClause += ` AND s.start_date >= ?`;
        values.push(startDate);
      }
      if (endDate) {
        whereClause += ` AND s.start_date <= ?`;
        values.push(endDate);
      }
    }

    // (C) 상태 검색 (CASE)
    // searchType='status' & searchValue in [예정, 진행중, 완료]
    if (searchType === "status" && searchValue) {
      whereClause += `
        AND (
          CASE
            WHEN NOW() < s.start_date THEN '예정'
            WHEN NOW() > s.end_date   THEN '완료'
            ELSE '진행중'
          END
        ) = ?
      `;
      values.push(searchValue);
    }

    // --------------------
    // 2) totalCount 조회
    // --------------------
    const [countRows] = await pool.execute(
      `
      SELECT COUNT(*) AS totalCount
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN schedules s ON oi.schedule_id = s.id
      ${whereClause}
      `,
      values
    );
    const totalCount = countRows[0]?.totalCount || 0;

    // --------------------
    // 4) 실제 데이터 조회
    // --------------------
    // SELECT 시에도 CASE로 status 필드를 내려주면 프론트에서 그대로 사용 가능
    const query = `
SELECT
  s.*,
  oi.order_id,
  CASE
    WHEN NOW() < s.start_date THEN '예정'
    WHEN NOW() > s.end_date   THEN '완료'
    ELSE '진행중'
  END AS status,
  (
    SELECT r.id FROM reviews r
    WHERE r.user_id = o.user_id AND r.product_id = s.product_id
    LIMIT 1
  ) AS review_id,
  (
    SELECT r.rating FROM reviews r
    WHERE r.user_id = o.user_id AND r.product_id = s.product_id
    LIMIT 1
  ) AS review_rating,
  (
    SELECT r.comment FROM reviews r
    WHERE r.user_id = o.user_id AND r.product_id = s.product_id
    LIMIT 1
  ) AS review_comment,
  (
    SELECT r.created_at FROM reviews r
    WHERE r.user_id = o.user_id AND r.product_id = s.product_id
    LIMIT 1
  ) AS review_created_at,
  (
    SELECT r.updated_at FROM reviews r
    WHERE r.user_id = o.user_id AND r.product_id = s.product_id
    LIMIT 1
  ) AS review_updated_at,
  EXISTS (
    SELECT 1 FROM reviews r
    WHERE r.user_id = o.user_id AND r.product_id = s.product_id
  ) AS is_reviewed
  -- ✅ 새로 추가할 부분

FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN schedules s ON oi.schedule_id = s.id
${whereClause}
LIMIT ${limit} OFFSET ${offset}
`;

    console.log("🧪 Final Query:", query);
    console.log("🧪 values:", values);

    const [courses] = await pool.execute(query, values);

    return res.json({
      success: true,
      courses,
      totalCount,
    });
  } catch (err) {
    console.error("❌ 수강내역 조회 실패:", err);
    return res
      .status(500)
      .json({ success: false, message: "수강내역 조회 실패" });
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "로그인 필요" });

    // payment.model.js의 getPaymentHistoryByUser 사용
    const payments = await paymentModel.getPaymentHistoryByUser(userId);

    return res.status(200).json({ success: true, payments });
  } catch (error) {
    console.error("❌ 결제내역 오류:", error);
    return res.status(500).json({ message: "결제내역 조회 실패" });
  }
};

exports.getCoupons = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "로그인 필요" });

    const coupons = await couponModel.getCouponsByUser(userId);
    return res.status(200).json({ success: true, coupons });
  } catch (error) {
    console.error("❌ 쿠폰 조회 오류:", error);
    return res.status(500).json({ message: "쿠폰 조회 실패" });
  }
};

exports.getPoints = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "로그인 필요" });

    const points = await pointModel.getPointsByUser(userId);
    return res.status(200).json({ success: true, points });
  } catch (error) {
    console.error("❌ 포인트 조회 오류:", error);
    return res.status(500).json({ message: "포인트 조회 실패" });
  }
};

exports.createInquiry = async (req, res) => {
  try {
    const { title, message } = req.body;
    const userId = req.user?.id;
    const attachment = req.file?.blobUrl || null; // 🔥 Blob URL 저장

    if (!userId) return res.status(401).json({ message: "로그인 필요" });

    await inquiryModel.createInquiry(userId, title, message, attachment);

    return res.status(201).json({
      success: true,
      message: "문의가 접수되었습니다.",
      url: attachment, // 🔁 프론트에서 쓸 수 있게 반환도 가능
    });
  } catch (error) {
    console.error("❌ 1:1 문의 생성 실패:", error);
    return res.status(500).json({ message: "문의 생성 실패" });
  }
};

exports.getInquiriesByUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "로그인 필요" });

    const inquiries = await inquiryModel.getInquiriesByUser(userId);
    return res.status(200).json({ success: true, inquiries });
  } catch (error) {
    console.error("❌ 문의 조회 실패:", error);
    return res.status(500).json({ message: "문의 조회 실패" });
  }
};

exports.updateInquiryAnswer = async (req, res) => {
  try {
    const { inquiryId, answer } = req.body;
    await inquiryModel.updateInquiryAnswer(inquiryId, answer);

    return res
      .status(200)
      .json({ success: true, message: "답변이 추가되었습니다." });
  } catch (error) {
    console.error("❌ 답변 추가 실패:", error);
    return res.status(500).json({ message: "답변 추가 실패" });
  }
};
exports.deleteInquiry = async (req, res) => {
  try {
    const userId = req.user?.id;
    const inquiryId = req.params.id;

    if (!userId) return res.status(401).json({ message: "로그인 필요" });

    const deleted = await inquiryModel.deleteInquiryByUser(inquiryId, userId);

    if (deleted.affectedRows === 0) {
      return res
        .status(403)
        .json({ message: "삭제 권한 없음 또는 이미 답변된 문의입니다." });
    }

    return res.status(200).json({ success: true, message: "문의 삭제 완료" });
  } catch (error) {
    console.error("❌ 문의 삭제 실패:", error);
    return res.status(500).json({ message: "문의 삭제 실패" });
  }
};
