import moment from "moment";
import { groupBy } from "lodash"; // npm install lodash 필요

const typeMap = {
  followup: "1",
  certification: "2",
  공개교육: "3",
  facilitation: "4",
};
const categoryMap = {
  교육: "1",
  컨설팅: "2",
  진단: "3",
  기타: "4",
};

export default function processEvents(schedules, colorMode) {
  const grouped = groupBy(schedules, (e) =>
    moment(e.start).format("YYYY-MM-DD")
  );

  const visibleEvents = [];
  const hiddenEventsMap = {};

  for (const [date, items] of Object.entries(grouped)) {
    const shown = items.slice(0, 2);
    const hidden = items.slice(2);

    shown.forEach((s) => {
      const value =
        colorMode === "type"
          ? typeMap[s.product_type] || "0"
          : categoryMap[s.product_category] || "0";

      visibleEvents.push({
        ...s,
        className: value ? `${colorMode}-${value}` : "",
      });
    });

    if (hidden.length > 0) {
      hiddenEventsMap[date] = hidden;
    }
  }

  return { visibleEvents, hiddenEventsMap };
}
