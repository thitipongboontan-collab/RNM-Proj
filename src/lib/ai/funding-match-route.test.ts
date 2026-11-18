import assert from "node:assert/strict";
import { routeQuery } from "@/lib/ai/router";
import { isFundingToResearchersQuestion, isMatchFundingQuestion } from "@/lib/ai/text-utils";

assert.equal(isFundingToResearchersQuestion("ทุน FD001 เหมาะกับใคร"), true);
assert.equal(isFundingToResearchersQuestion("แหล่งทุนนี้เหมาะกับนักวิจัยคนไหน"), true);
assert.equal(isFundingToResearchersQuestion("ใครเหมาะกับทุนวิจัยด้านมลพิษอากาศ"), true);
assert.equal(isFundingToResearchersQuestion("นักวิจัย RS001 มีผลงานกี่ชิ้น"), false);

assert.equal(isMatchFundingQuestion("แนะนำทุนให้นักวิจัย RS001"), true);
assert.equal(isMatchFundingQuestion("ทุน FD001 เหมาะกับใคร"), false);

assert.equal(routeQuery("ทุน FD007 เหมาะกับนักวิจัยคนไหน", []).intent, "match_researchers_for_funding");
assert.equal(routeQuery("แหล่งทุนนี้เหมาะกับใคร", []).intent, "match_researchers_for_funding");
assert.equal(routeQuery("แนะนำทุนให้นักวิจัย RS001", ["ภาควิชาภูมิศาสตร์"]).intent, "match_funding");

console.log("funding match route tests passed");
