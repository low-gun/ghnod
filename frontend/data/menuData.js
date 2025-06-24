// frontend/data/menuData.js

// 왼쪽 그룹 (로고 등)
export const leftGroup = [
  {
    label: "로고",
    isLogo: true,
  },
];

// 중앙 그룹 (진단, 교육, 컨설팅 등 예시)
export const centerGroup = [
  {
    label: "진단",
    link: "/diagnosis",
    sub: [
      { label: "Hogan", slug: "hogan" },
      { label: "TAI리더십", slug: "tai" },
      { label: "조직건강도", slug: "orghealth" },
      { label: "RNP", slug: "rnp" },
      { label: "팀효과성", slug: "teamEffect" },
    ],
  },
  {
    label: "교육",
    link: "/education",
    sub: [
      { label: "followup", slug: "followup" },
      { label: "certification", slug: "certification" },
      { label: "공개교육", slug: "opencourse" },
      { label: "facilitation", slug: "facilitation" },
    ],
  },
  {
    label: "교육일정",
    link: "/education/calendar",
  },
  {
    label: "컨설팅",
    link: "/consulting",
    sub: [
      { label: "워크숍", slug: "workshop" },
      { label: "숙의토론", slug: "discussion" },
      { label: "조직개발", slug: "orgdev" },
    ],
  },
  {
    label: "수행사례",
    link: "https://blog.naver.com/orpinstitute_hrd_od",
    newTab: true,
  },
  {
    label: "FTShop",
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
        },
  ];
}
