// frontend/data/menuData.js
import { LogIn as LogInIcon } from "lucide-react";

// 왼쪽 그룹 (로고 등)
export const leftGroup = [
  {
    label: "로고",
    isLogo: true,
  },
];

export const centerGroup = [
  {
    label: "진단",
    link: "/diagnosis",
    sub: [
      { label: "조직", slug: "org" },
      { label: "팀", slug: "team" },
      { label: "리더십", slug: "leadership" },
      { label: "개인", slug: "individual" },
    ],
  },
  {
    label: "조직 개발",
    link: "/orgdev",
    sub: [
      { label: "조직", slug: "org" },
      { label: "팀", slug: "team" },
      { label: "개인", slug: "individual" },
    ],
  },
  {
    label: "리더십 개발",
    link: "/leadership",
    sub: [
      { label: "진단 기반", slug: "assessment" },
      { label: "DCBL", slug: "dcbl" },
      { label: "컨설팅", slug: "consulting" },
      { label: "컨텐츠교육(예정)", slug: "content" },
      { label: "New Solution(예정)", slug: "new" },
    ],
  },
  {
    label: "공개과정",
    link: "/opencourse",
    sub: [
      { label: "Hogan", slug: "hogan" },
      { label: "Assessment", slug: "assessment" },
      { label: "Development", slug: "development" },
      { label: "Facilitation", slug: "facilitation" },
      { label: "진단 Certification", slug: "certification" },
      { label: "FT", slug: "ft" },
    ],
  },
  {
    label: "사회적 대화",
    link: "/socialdialogue",
    sub: [
      { label: "원페이지", slug: "onepage" },
      { label: "문의하기", slug: "inquiry" },
    ],
  },
  {
    label: "일정",
    link: "/calendar",
  },
  {
    label: "교보재 판매",
    link: "https://smartstore.naver.com/facilitationshop",
    newTab: true,
  },
];

// 오른쪽 그룹
// user가 있으면 프로필 아이콘(FaUser),
// 없으면 로그인 버튼, 그리고 공통으로 수행사례, FTShop
export function getRightGroup(user) {
  return [
    user
      ? {
          label: "FaUser", // 프로필 아이콘
          isProfile: true,
        }
        : {
          label: "로그인",
          link: "/login",
          icon: <LogInIcon size={25} />,
        },
  ];
}
