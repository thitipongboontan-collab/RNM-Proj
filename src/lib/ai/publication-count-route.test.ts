import assert from "node:assert/strict";
import { routeQuery } from "@/lib/ai/router";
import { isPublicationCountQuestion } from "@/lib/ai/text-utils";

const question = "ใครมีข้อมูลผลงานตีพิมพ์ผลงานทางวิชาการ มากที่สุด";

assert.equal(isPublicationCountQuestion(question), true);
assert.equal(routeQuery(question, []).intent, "publication_count");
assert.equal(isPublicationCountQuestion("ช่วยสรุปตำแหน่งทางวิชาการกี่คน"), false);

console.log("publication count routing tests passed");
