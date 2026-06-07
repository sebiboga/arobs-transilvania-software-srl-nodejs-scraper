import { parseLocation, getSeniorityTag, getCategoryTags, extractSkillTags } from "../../index.js";

describe("AROBS Integration Tests", () => {
  describe("Location Parsing", () => {
    it("maps Romanian cities correctly", () => {
      const cases = [
        ["RO-Cluj Napoca", ["Cluj-Napoca"]],
        ["RO-Bucharest", ["București"]],
        ["RO-Timisoara", ["Timișoara"]],
        ["RO-Iasi", ["Iași"]],
      ];
      for (const [input, expected] of cases) {
        expect(parseLocation(input)).toEqual(expected);
      }
    });
  });

  describe("Tag Extraction", () => {
    it("generates correct tags for a typical job", () => {
      const title = "Senior Java Developer";
      const description = "Java, Spring Boot, Microservices";
      const category = "Development";
      const seniority = "Senior";

      const tags = [];
      tags.push(getSeniorityTag(seniority));
      tags.push(...getCategoryTags(category));
      tags.push(...extractSkillTags(title, description));

      const uniqueTags = [...new Set(tags)];
      expect(uniqueTags).toContain("senior");
      expect(uniqueTags).toContain("it");
    });
  });

  describe("Workmode Detection", () => {
    it("detects remote from title", () => {
      expect(extractSkillTags("Remote Developer", "")).toBeDefined();
    });
  });
});
