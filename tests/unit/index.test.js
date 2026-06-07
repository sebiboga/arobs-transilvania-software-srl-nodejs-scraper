import { parseJobsPage, parseLocation, getSeniorityTag, getCategoryTags, extractSkillTags } from "../../index.js";

const sampleHtml = `<!doctype html><html><body>
<div class="iCIMS_MainWrapper">
<ul class="container-fluid iCIMS_JobsTable">
<li class="iCIMS_JobCardItem">
<div class="row">
<div class="col-xs-6 header left"><span class="sr-only field-label">Job Locations</span><span>RO-Cluj Napoca</span></div>
<div class="col-xs-6 header right"><span class="sr-only field-label">Posted Date</span><span title="21/05/2026 08:42">2 weeks ago</span></div>
<div class="col-xs-12 title">
<a href="/jobs/3444/supplier-audit/job?in_iframe=1" class="iCIMS_Anchor"><h3>Supplier Audit</h3></a>
</div>
<div class="col-xs-12 description">Work cross-functionally with manufacturing teams.</div>
<div class="col-xs-12 additionalFields">
<dl class="iCIMS_JobHeaderGroup">
<div class="iCIMS_JobHeaderTag"><dt class="iCIMS_JobHeaderField">Job ID</dt><dd class="iCIMS_JobHeaderData"><span>2026-3444</span></dd></div>
<div class="iCIMS_JobHeaderTag"><dt class="iCIMS_JobHeaderField">Category</dt><dd class="iCIMS_JobHeaderData"><span>IT Special Roles</span></dd></div>
<div class="iCIMS_JobHeaderTag"><dt class="iCIMS_JobHeaderField">Seniority</dt><dd class="iCIMS_JobHeaderData"><span>Senior</span></dd></div>
</dl>
</div>
</div>
</li>
</ul>
<h2 class="iCIMS_SubHeader iCIMS_SubHeader_Jobs">Search Results Page 1 of 1</h2>
</div></body></html>`;

describe("parseJobsPage", () => {
  it("parses job listings from iCIMS HTML", () => {
    const result = parseJobsPage(sampleHtml);
    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0].title).toBe("Supplier Audit");
    expect(result.jobs[0].url).toBe("https://careers-arobs.icims.com/jobs/3444/supplier-audit/job");
    expect(result.jobs[0].location).toEqual(["Cluj-Napoca"]);
    expect(result.jobs[0].category).toBe("IT Special Roles");
    expect(result.jobs[0].seniority).toBe("Senior");
    expect(result.totalPages).toBe(1);
  });

  it("handles empty page", () => {
    const result = parseJobsPage("<html><body></body></html>");
    expect(result.jobs).toHaveLength(0);
  });
});

describe("parseLocation", () => {
  it("handles RO prefix", () => {
    expect(parseLocation("RO-Bucharest")).toEqual(["București"]);
  });

  it("handles multiple locations", () => {
    expect(parseLocation("RO-Cluj Napoca | RO-Bucharest")).toEqual(["Cluj-Napoca", "București"]);
  });

  it("handles RO only", () => {
    expect(parseLocation("RO")).toEqual(["România"]);
  });

  it("handles empty", () => {
    expect(parseLocation("")).toEqual(["România"]);
  });
});

describe("getSeniorityTag", () => {
  it("returns senior for senior level", () => {
    expect(getSeniorityTag("Senior")).toBe("senior");
  });

  it("returns mid for intermediate", () => {
    expect(getSeniorityTag("Mid")).toBe("mid");
  });

  it("returns junior for junior level", () => {
    expect(getSeniorityTag("Junior")).toBe("junior");
  });

  it("returns mid as default", () => {
    expect(getSeniorityTag("")).toBe("mid");
  });
});

describe("getCategoryTags", () => {
  it("maps Development to it", () => {
    expect(getCategoryTags("Development")).toEqual(["it"]);
  });

  it("maps Testing to qa", () => {
    expect(getCategoryTags("Testing")).toEqual(["qa"]);
  });

  it("returns empty for unknown", () => {
    expect(getCategoryTags("Unknown")).toEqual([]);
  });
});

describe("extractSkillTags", () => {
  it("extracts Java tag", () => {
    expect(extractSkillTags("Java Developer", "")).toContain("it");
  });

  it("extracts embedded tag", () => {
    expect(extractSkillTags("Embedded Software Engineer", "")).toContain("embedded");
  });

  it("extracts multiple tags", () => {
    const tags = extractSkillTags("Senior DevOps Engineer", "Kubernetes and AWS cloud");
    expect(tags).toContain("devops");
    expect(tags).toContain("cloud");
  });
});
