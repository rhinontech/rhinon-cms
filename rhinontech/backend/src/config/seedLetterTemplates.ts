import { sequelize } from "./database";
import { LetterTemplate, syncDatabase } from "../models";
import type { LetterBlock, LetterTemplateKey } from "../types/letterBlocks";

// One-time bootstrap for the offer letter / NDA content that used to be
// hardcoded in services/letters.ts — now the DB-backed, admin-editable source
// of truth (see LetterTemplate). Idempotent via findOrCreate: never overwrites
// a row that already exists, so re-running this after an admin has edited a
// template in the UI is always safe.

// A plain `Omit<LetterBlock, "id">` collapses the discriminated union (Omit
// isn't distributive), losing per-variant fields like `num`/`marker`. This
// distributes Omit over each union member first, then re-unions.
type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;
type BlockInput = DistributiveOmit<LetterBlock, "id">;

function withIds(prefix: string, blocks: BlockInput[]): LetterBlock[] {
  return blocks.map((b, i) => ({ ...b, id: `${prefix}-${i}` } as LetterBlock));
}

const TERMINATION_SUBCLAUSES: BlockInput[] = [
  { kind: "numbered", marker: "a.", indent: 13, text: "Violation of company policies or non-compliance with the employment agreement." },
  { kind: "numbered", marker: "b.", indent: 13, text: "Misconduct, dishonesty, or inappropriate behavior within the workplace." },
  { kind: "numbered", marker: "c.", indent: 13, text: "Poor performance reviews with no sign of improvement for 2 consecutive months." },
  { kind: "numbered", marker: "d.", indent: 13, text: "Intentionally or negligently disclosing any Confidential Information to any unauthorized person or entity." },
  { kind: "numbered", marker: "e.", indent: 13, text: "Intentionally or negligently misusing or misappropriating any Confidential Information." },
  { kind: "numbered", marker: "f.", indent: 13, text: "Failure to comply with the Company's security policies or procedures regarding Confidential Information." },
  { kind: "numbered", marker: "g.", indent: 13, text: "Failure to return all company property and settle any pending documents upon request." },
];

const CODE_OF_CONDUCT: BlockInput[] = [
  { kind: "heading", num: "8", text: "Code of Conduct" },
  { kind: "numbered", marker: "1.", text: "**Professionalism:** Always maintain a professional demeanor in all interactions with colleagues and clients." },
  { kind: "numbered", marker: "2.", text: "**Punctuality:** Be punctual and accountable for the working hours agreed upon." },
  { kind: "numbered", marker: "3.", text: "**Workplace Ethics:** Follow all company policies, including those related to cybersecurity, workplace behavior, and data protection." },
  { kind: "numbered", marker: "4.", text: "**Teamwork:** Collaborate effectively with other team members and contribute positively to the company's culture." },
  { kind: "paragraph", text: "Failure to comply with these guidelines may result in termination or other disciplinary actions." },
];

const NEXT_STEPS: BlockInput[] = [
  { kind: "heading", num: "9", text: "Next Steps and Acceptance" },
  { kind: "paragraph", text: "To confirm your acceptance of this offer, please sign and return a copy of this letter by **{{dates.acceptanceDeadline}}**. We are excited to have you as part of the Rhinon Tech team and look forward to your contributions." },
  { kind: "paragraph", text: "If you have any questions or require further clarification, feel free to reach out to the HR Department at {{support.email}}" },
];

const OFFER_LETTER_FULLTIME: BlockInput[] = [
  { kind: "heading", num: "1", text: "Introduction to Rhinon Tech" },
  { kind: "paragraph", text: "We are thrilled to offer you the opportunity to work with **Rhinon Tech**, a cutting-edge technology company dedicated to pushing the boundaries of innovation and excellence. Since our inception, Rhinon Tech has been at the forefront of developing scalable solutions and empowering industries with the tools to grow in a highly competitive marketplace." },
  { kind: "paragraph", text: "As a company that values creativity, innovation, and a passion for technology, we believe in providing our employees with the best learning experience and preparing them for future roles in the industry. Through this employment, you will be involved in projects that contribute directly to Rhinon Tech's mission." },

  { kind: "heading", num: "2", text: "Offer of Employment" },
  { kind: "paragraph", text: "We are pleased to offer you the position of **{{employee.roleTitle}}** starting from **{{dates.startLong}}**. This position is an important step toward building your professional experience, and we look forward to seeing your contributions in real-world projects." },
  { kind: "paragraph", text: "This role will help you gain skills in Product Development and AI with talented professionals and get exposure to cutting-edge technologies." },

  { kind: "heading", num: "3", text: "Employment Position Details" },
  { kind: "bullet", text: "**Designation:** {{employee.roleTitle}}" },
  { kind: "bullet", text: "**Location:** {{employee.locationLine}}" },
  { kind: "bullet", text: "**Employment Type:** {{employee.employmentTypeLabel}}" },
  { kind: "bullet", text: "**Work Schedule:** {{employee.workScheduleOrDefault}}" },

  { kind: "heading", num: "4", text: "Compensation and Benefits" },
  { kind: "paragraph", text: "Your starting compensation package includes an annual CTC of **{{compensation.annualCtcOrDiscussed}}** paid on a **monthly basis** in accordance with our standard payroll cycle. Your compensation will be subject to annual performance reviews." },
  { kind: "paragraph", text: "You will enjoy the following benefits as an employee at Rhinon Tech:" },
  { kind: "bullet", text: "**Mentorship:** You will be assigned a mentor who will provide guidance throughout your tenure." },
  { kind: "bullet", text: "**Workshops and Training:** Access to internal training programs and workshops that align with your field of work." },
  { kind: "bullet", text: "**Networking Opportunities:** Participate in company events, meetups, and team-building exercises to build professional connections." },
  { kind: "bullet", text: "**Team Collaboration:** Engage with various teams and departments to understand how cross-functional collaboration leads to the success of a company." },

  { kind: "heading", num: "5", text: "Terms and Conditions" },
  { kind: "subheading", text: "Working Hours" },
  { kind: "paragraph", text: "The standard working hours for the role will be **{{employee.workingHours}}**, with appropriate breaks. You may be required to work additional hours depending on project needs, but this will be communicated well in advance." },
  { kind: "subheading", text: "Performance Reviews" },
  { kind: "paragraph", text: "Throughout your employment, you will be subject to regular performance reviews. These reviews are designed to assess your progress and provide feedback for improvement. Based on these evaluations, you will be given opportunities to work on more complex projects or explore different areas of interest within the company." },
  { kind: "subheading", text: "Confidentiality Agreement" },
  { kind: "paragraph", text: "During your association with Rhinon Tech, you may have access to sensitive and proprietary information. It is expected that you maintain confidentiality and not disclose any company-related information to external parties. A separate Non-Disclosure Agreement (NDA) will be provided to you on the first day of your employment." },
  { kind: "subheading", text: "Intellectual Property" },
  { kind: "paragraph", text: "Any work, project, or intellectual property developed by you during the employment remains the sole property of **Rhinon Tech**. You will be expected to transfer all rights of any code, design, or product developed during your tenure to the company." },

  { kind: "heading", num: "6", text: "Termination Clause" },
  { kind: "paragraph", text: "While we expect you to successfully complete your tenure, both the employee and Rhinon Tech have the right to terminate the agreement under the following conditions:" },
  { kind: "bullet", text: "**Voluntary Termination:** Either party may terminate the agreement with **1 Month Prior Notice**. A written notice is required in case you decide to discontinue." },
  { kind: "bullet", text: "**Involuntary Termination:** The company reserves the right to terminate immediately if any of the following occurs:" },
  ...TERMINATION_SUBCLAUSES,

  { kind: "heading", num: "7", text: "Performance Appraisals and Opportunities" },
  { kind: "paragraph", text: "At the conclusion of your annual cycle, we will conduct a **formal review of your performance**. This review will evaluate your contributions, professionalism, teamwork, and learning agility." },
  { kind: "paragraph", text: "**Growth Outcomes:**" },
  { kind: "numbered", marker: "1.", text: "**Experience Certification:** Standard certificate referencing your duration, skills, and projects." },
  { kind: "numbered", marker: "2.", text: "**Career Advancement:** Eligible for promotion, leadership tracks, and direct bonuses based on metrics." },
  { kind: "paragraph", text: "We strongly believe in recognizing talent, and those who demonstrate exceptional performance and alignment with our company culture will be considered for permanent leadership positions with Rhinon Tech." },

  ...CODE_OF_CONDUCT,
  ...NEXT_STEPS,
];

const OFFER_LETTER_INTERN: BlockInput[] = [
  { kind: "heading", num: "1", text: "Introduction to Rhinon Tech" },
  { kind: "paragraph", text: "We are thrilled to offer you the opportunity to intern with **Rhinon Tech**, a cutting-edge technology company dedicated to pushing the boundaries of innovation and excellence. Since our inception, Rhinon Tech has been at the forefront of developing scalable solutions and empowering industries with the tools to grow in a highly competitive marketplace." },
  { kind: "paragraph", text: "As a company that values creativity, innovation, and a passion for technology, we believe in providing our interns with the best learning experience and preparing them for future roles in the industry. Through this internship, you will be involved in projects that contribute directly to Rhinon Tech's mission." },

  { kind: "heading", num: "2", text: "Offer of Internship" },
  { kind: "paragraph", text: "We are pleased to offer you the position of **{{employee.roleTitle}}** for a period of **6 months** starting from **{{dates.internStartShort}}** to **{{dates.internEndShort}}**. This position is an important step toward building your professional experience, and we look forward to seeing your contributions in real-world projects." },
  { kind: "paragraph", text: "This role will help you gain skills in Product Development and AI with talented professionals and get exposure to cutting-edge technologies." },

  { kind: "heading", num: "3", text: "Internship Position Details" },
  { kind: "bullet", text: "**Designation:** {{employee.roleTitle}}" },
  { kind: "bullet", text: "**Location:** {{employee.locationLine}}" },
  { kind: "bullet", text: "**Internship Duration:** 6 months" },
  { kind: "bullet", text: "**Work Schedule:** {{employee.workScheduleOrDefault}}" },

  { kind: "heading", num: "4", text: "Compensation and Benefits" },
  { kind: "paragraph", text: "During your internship period, this is a paid internship for **{{compensation.monthlyStipend}}/- per month**. After three months, there will be a review meeting to assess your performance, and based on this review, we will decide on future opportunities and compensation." },
  { kind: "paragraph", text: "You will enjoy the following benefits as an intern at Rhinon Tech:" },
  { kind: "bullet", text: "**Mentorship:** You will be assigned a mentor who will provide guidance throughout your internship." },
  { kind: "bullet", text: "**Workshops and Training:** Access to internal training programs and workshops that align with your field of work." },
  { kind: "bullet", text: "**Networking Opportunities:** Participate in company events, meetups, and team-building exercises to build professional connections." },
  { kind: "bullet", text: "**Team Collaboration:** Engage with various teams and departments to understand how cross-functional collaboration leads to the success of a company." },

  { kind: "heading", num: "5", text: "Terms and Conditions" },
  { kind: "subheading", text: "Working Hours" },
  { kind: "paragraph", text: "The standard working hours for the internship will be **{{employee.workingHours}}**, with appropriate breaks. You may be required to work additional hours depending on project needs, but this will be communicated well in advance." },
  { kind: "subheading", text: "Performance Reviews" },
  { kind: "paragraph", text: "Throughout your internship, you will be subject to regular performance reviews. These reviews are designed to assess your progress and provide feedback for improvement. Based on these evaluations, you will be given opportunities to work on more complex projects or explore different areas of interest within the company." },
  { kind: "subheading", text: "Confidentiality Agreement" },
  { kind: "paragraph", text: "During your association with Rhinon Tech, you may have access to sensitive and proprietary information. It is expected that you maintain confidentiality and not disclose any company-related information to external parties. A separate Non-Disclosure Agreement (NDA) will be provided to you on the first day of your internship." },
  { kind: "subheading", text: "Intellectual Property" },
  { kind: "paragraph", text: "Any work, project, or intellectual property developed by you during the internship remains the sole property of **Rhinon Tech**. You will be expected to transfer all rights of any code, design, or product developed during your tenure to the company." },

  { kind: "heading", num: "6", text: "Termination Clause" },
  { kind: "paragraph", text: "While we expect you to successfully complete your tenure, both the intern and Rhinon Tech have the right to terminate the agreement under the following conditions:" },
  { kind: "bullet", text: "**Voluntary Termination:** Either party may terminate the agreement with **1 Month Prior Notice**. A written notice is required in case you decide to discontinue." },
  { kind: "bullet", text: "**Involuntary Termination:** The company reserves the right to terminate immediately if any of the following occurs:" },
  ...TERMINATION_SUBCLAUSES,

  { kind: "heading", num: "7", text: "Post-Internship Review and Opportunities" },
  { kind: "paragraph", text: "At the conclusion of your internship, we will conduct a **formal review of your performance**. This review will evaluate your contributions, professionalism, teamwork, and learning agility." },
  { kind: "paragraph", text: "**Post-Internship Outcomes:**" },
  { kind: "numbered", marker: "1.", text: "**Certificate of Completion:** Issued if you have met the internship objectives satisfactorily." },
  { kind: "numbered", marker: "2.", text: "**Experience Letter:** Provided to highlight your key contributions and the skills you have developed." },
  { kind: "numbered", marker: "3.", text: "**Full-Time Employment Opportunity:** Outstanding interns may be offered a full-time role with Rhinon Tech in a relevant department, subject to the availability of openings." },
  { kind: "paragraph", text: "We strongly believe in recognizing talent, and those who demonstrate exceptional performance and alignment with our company culture will be considered for permanent leadership positions with Rhinon Tech." },

  ...CODE_OF_CONDUCT,
  ...NEXT_STEPS,
];

// Transcribed verbatim from the retired services/letters.ts ndaBody() function
// (a LawDepot-derived freelance-agreement template adapted to an employment
// NDA — see the git history on letters.ts for the original transformation
// notes). "23b" carries the only two placeholders in the whole document.
const NDA: BlockInput[] = [
  { kind: "subheading", text: "BACKGROUND:" },
  { kind: "numbered", marker: "1.", text: `The Employee is employed by the Company for the position of: **{{employee.roleTitle}}**. In addition to this responsibility or position (the "Employment"), this Agreement also covers any position or responsibility now or later held with the Company.` },
  { kind: "numbered", marker: "2.", text: `The Employee will receive from the Company, or develop on behalf of the Company, Confidential Information as a result of the Employment (the "Permitted Purpose").` },
  { kind: "paragraph", text: `IN CONSIDERATION OF and as a condition of the Company employing the Employee and the Company providing the Confidential Information to the Employee, in addition to other valuable consideration, the receipt and sufficiency of which consideration is hereby acknowledged, the parties to this Agreement agree as follows:` },

  { kind: "heading", text: "Confidential Information" },
  { kind: "numbered", marker: "1.", text: `All written and oral information and materials disclosed or provided by the Company to the Employee under this Agreement constitute Confidential Information regardless of whether such information was provided before or after the date of this Agreement or how it was provided to the Employee.` },
  { kind: "numbered", marker: "2.", text: `The Employee acknowledges that in any position the Employee may hold, in and as a result of the Employee's employment by the Company, the Employee will, or may, be making use of, acquiring or adding to information about certain matters and things which are confidential to the Company and which information is the exclusive property of the Company.` },
  { kind: "numbered", marker: "3.", text: `'Confidential Information' means all data and information relating to the business and management of the Company, including but not limited to, the following:` },
  { kind: "numbered", marker: "a.", indent: 18, text: `'Business Operations' which includes internal personnel and financial information of the Company, vendor names and other vendor information (including vendor characteristics, services and agreements), purchasing and internal cost information, internal services and operational manuals, external business contacts including those stored on social media accounts or other similar platforms or databases operated by the Company, and the manner and methods of conducting the Company's business;` },
  { kind: "numbered", marker: "b.", indent: 18, text: `'Customer Information' which includes names of customers of the Company, their representatives, all customer contact information, contracts and their contents and parties, customer services, data provided by customers and the type, quantity and specifications of products and services purchased, leased, licensed or received by customers of the Company;` },
  { kind: "numbered", marker: "c.", indent: 18, text: `'Intellectual Property' which includes information relating to the Company's proprietary rights prior to any public disclosure of such information, including but not limited to the nature of the proprietary rights, production data, technical and engineering data, technical concepts, test data and test results, simulation results, the status and details of research and development of products and services, and information regarding acquiring, protecting, enforcing and licensing proprietary rights (including patents, copyrights and trade secrets);` },
  { kind: "numbered", marker: "d.", indent: 18, text: `'Service Information' which includes all data and information relating to the services provided by the Company, including but not limited to, plans, schedules, manpower, inspection, and training information;` },
  { kind: "numbered", marker: "e.", indent: 18, text: `'Product Information' which includes all specifications for products of the Company as well as work product resulting from or related to work or projects performed or to be performed for the Company or for clients of the Company, of any type or form in any stage of actual or anticipated research and development;` },
  { kind: "numbered", marker: "f.", indent: 18, text: `'Production Processes' which includes processes used in the creation, production and manufacturing of the work product of the Company, including but not limited to, formulas, patterns, moulds, models, methods, techniques, specifications, processes, procedures, equipment, devices, programs, and designs;` },
  { kind: "numbered", marker: "g.", indent: 18, text: `'Accounting Information' which includes, without limitation, all financial statements, annual reports, balance sheets, company asset information, company liability information, revenue and expense reporting, profit and loss reporting, cash flow reporting, accounts receivable, accounts payable, inventory reporting, purchasing information and payroll information of the Company;` },
  { kind: "numbered", marker: "h.", indent: 18, text: `'Marketing and Development Information' which includes marketing and development plans of the Company, price and cost data, price and fee amounts, pricing and billing policies, quoting procedures, marketing techniques and methods of obtaining business, forecasts and forecast assumptions and volumes, and future plans and potential strategies of the Company which have been or are being discussed;` },
  { kind: "numbered", marker: "i.", indent: 18, text: `'Computer Technology' which includes all scientific and technical information or material of the Company, pertaining to any machine, appliance or process, including but not limited to, specifications, proposals, models, designs, formulas, test results and reports, analyses, simulation results, tables of operating conditions, materials, components, industrial skills, operating and testing procedures, shop practices, know how and show-how;` },
  { kind: "numbered", marker: "j.", indent: 18, text: `'Proprietary Computer Code' which includes all sets of statements, instructions or programs of the Company, whether in human readable or machine readable form, that are expressed, fixed, embodied or stored in any manner and that can be used directly or indirectly in a computer ('Computer Programs'); any report format, design or drawing created or produced by such Computer Programs; and all documentation, design specifications and charts, and operating procedures which support the Computer Programs; and` },
  { kind: "numbered", marker: "k.", indent: 18, text: `Confidential Information will also include any information that has been disclosed by a third party to the Company and is protected by a non-disclosure agreement entered into between the third party and the Company.` },
  { kind: "numbered", marker: "4.", text: `Confidential Information will not include the following information:` },
  { kind: "numbered", marker: "a.", indent: 18, text: `Information that is generally known in the industry of the Company;` },
  { kind: "numbered", marker: "b.", indent: 18, text: `Information that is now or subsequently becomes generally available to the public through no wrongful act of the Employee;` },
  { kind: "numbered", marker: "c.", indent: 18, text: `Information rightly in the possession of the Employee prior to the disclosure to the Employee by the Company;` },
  { kind: "numbered", marker: "d.", indent: 18, text: `Information that is independently created by the Employee without direct or indirect use of the Confidential Information; or` },
  { kind: "numbered", marker: "e.", indent: 18, text: `Information that the Employee rightfully obtains from a third party who has the right to transfer or disclose it.` },

  { kind: "heading", text: "Obligations of Non-Disclosure" },
  { kind: "numbered", marker: "5.", text: `Except as otherwise provided in this Agreement, the Employee must not disclose the Confidential Information.` },
  { kind: "numbered", marker: "6.", text: `Except as otherwise provided in this Agreement, the Confidential Information will remain the exclusive property of the Company and will only be used by the Employee for the Permitted Purpose. The Employee will not use the Confidential Information for any purpose that might be directly or indirectly detrimental to the Company or any associated affiliates or subsidiaries.` },
  { kind: "numbered", marker: "7.", text: `The obligations to ensure and prevent the disclosure of the Confidential Information imposed on the Employee in this Agreement and any obligations to provide notice under this Agreement will survive the expiration or termination, as the case may be, of this Agreement and those obligations will last indefinitely.` },
  { kind: "numbered", marker: "8.", text: `The Employee may disclose any of the Confidential Information:` },
  { kind: "numbered", marker: "a.", indent: 18, text: `to such employees, agents, representatives and advisors of the Employee that have a need to know for the Permitted Purpose provided that:` },
  { kind: "numbered", marker: "i.", indent: 32, text: `the Employee has informed such personnel of the confidential nature of the Confidential Information;` },
  { kind: "numbered", marker: "ii.", indent: 32, text: `such personnel agree to be legally bound to the same burdens of non-disclosure and non-use as the Employee;` },
  { kind: "numbered", marker: "iii.", indent: 32, text: `the Employee agrees to take all necessary steps to ensure that the terms of this Agreement are not violated by such personnel; and` },
  { kind: "numbered", marker: "iv.", indent: 32, text: `the Employee agrees to be responsible for and indemnify the Company for any breach of this Agreement by their personnel.` },
  { kind: "numbered", marker: "b.", indent: 18, text: `to a third party where the Company has consented in writing to such disclosure; and` },
  { kind: "numbered", marker: "c.", indent: 18, text: `to the extent required by law or by the request or requirement of any judicial, legislative, administrative or other governmental body.` },

  { kind: "heading", text: "Avoiding Conflict of Opportunities" },
  { kind: "numbered", marker: "9.", text: `It is understood and agreed that any business opportunity relating to or similar to the Company's current or anticipated business opportunities coming to the attention of the Employee during the Employee's employment is an opportunity belonging to the Company. Accordingly, the Employee will advise the Company of the opportunity and cannot pursue the opportunity, directly or indirectly, without the written consent of the Company.` },
  { kind: "numbered", marker: "10.", text: `Without the written consent of the Company, the Employee further agrees not to:` },
  { kind: "numbered", marker: "a.", indent: 18, text: `solely or jointly with others undertake or join any planning for or organisation of any business activity competitive with the current or anticipated business activities of the Company; and` },
  { kind: "numbered", marker: "b.", indent: 18, text: `directly or indirectly, engage or participate in any other business activities which the Company, in its reasonable discretion, determines to be in conflict with the best interests of the Company.` },

  { kind: "heading", text: "Non-Solicitation" },
  { kind: "numbered", marker: "11.", text: `Any attempt on the part of the Employee to induce others to leave the Company's employ, or any effort by the Employee to interfere with the Company's relationship with its other employees, would be harmful and damaging to the Company. The Employee agrees that from the date of this Agreement for a period of two years after the end of the Agreement, the Employee will not in any way, directly or indirectly:` },
  { kind: "numbered", marker: "a.", indent: 18, text: `induce or attempt to induce any employee of the Company to quit their employment with the Company;` },
  { kind: "numbered", marker: "b.", indent: 18, text: `otherwise interfere with or disrupt the Company's relationship with its employees;` },
  { kind: "numbered", marker: "c.", indent: 18, text: `discuss employment opportunities or provide information about competitive employment to any of the Company's employees; or` },
  { kind: "numbered", marker: "d.", indent: 18, text: `solicit, entice, or hire away any employee of the Company. This obligation will be limited in scope to those persons that were employees of the Company at the same time that the Employee was employed by the Company.` },

  { kind: "heading", text: "Non-Competition" },
  { kind: "numbered", marker: "12.", text: `Other than through employment with a bona-fide independent party, or with the express written consent of the Company, which will not be unreasonably withheld, the Employee will not, for a period of 2 years following termination of the Employment, be directly or indirectly involved with a business which is in direct competition with the particular business line of the Company that the Employee was working during any time in the last year of employment with the Company.` },
  { kind: "numbered", marker: "13.", text: `For a period of 2 years following termination of the Employment, the Employee will not divert or attempt to divert from the Company any business the Company had enjoyed, solicited, or attempted to solicit, from its customers, prior to termination or expiration, as the case may be, of the Employment.` },

  { kind: "heading", text: "Ownership and Title" },
  { kind: "numbered", marker: "14.", text: `The Employee acknowledges and agrees that all rights, title and interest in any Confidential Information will remain the exclusive property of the Company. Accordingly, the Employee specifically agrees and acknowledges that the Employee will have no interest in the Confidential Information, including, without limitation, no interest in know-how, copyright, trade mark or trade names, notwithstanding the fact that the Employee may have created or contributed to the creation of that Confidential Information.` },
  { kind: "numbered", marker: "15.", text: `The Employee does hereby waive any moral rights that the Employee may have with respect to the Confidential Information.` },
  { kind: "numbered", marker: "16.", text: `The Confidential Information will not include anything developed or produced by the Employee during the term of this Agreement, including but not limited to intellectual property, process, design, development, creation, research, invention, know-how, trade name, trade mark or copyright that:` },
  { kind: "numbered", marker: "a.", indent: 18, text: `was developed without the use of any equipment, supplies, facility or Confidential Information of the Company;` },
  { kind: "numbered", marker: "b.", indent: 18, text: `was developed entirely on the Employee's own time;` },
  { kind: "numbered", marker: "c.", indent: 18, text: `does not relate to the actual business or reasonably anticipated business of the Company;` },
  { kind: "numbered", marker: "d.", indent: 18, text: `does not relate to the actual or demonstrably anticipated processes, research, or development of the Company; and` },
  { kind: "numbered", marker: "e.", indent: 18, text: `does not result from any work performed by the Employee for the Company.` },
  { kind: "numbered", marker: "17.", text: `The Employee agrees to immediately disclose to the Company all Confidential Information developed in whole or in part by the Employee during the term of the Employment and to assign to the Company any right, title or interest the Employee may have in the Confidential Information. The Employee agrees to execute any instruments and to do all other things reasonably requested by the Company (both during and after the term of the Employment) in order to vest more fully in the Company all ownership rights in those items transferred by the Employee to the Company.` },

  { kind: "heading", text: "Remedies" },
  { kind: "numbered", marker: "18.", text: `The Employee agrees and acknowledges that the Confidential Information is of a proprietary and confidential nature and that any disclosure of the Confidential Information to a third party in breach of this Agreement cannot be reasonably or adequately compensated for in money damages and would cause irreparable injury to the Company. Accordingly, the Employee agrees that the Company is entitled to, in addition to all other rights and remedies available to it at law or in equity, an injunction restraining the Employee and any agents of the Employee, from directly or indirectly committing or engaging in any act restricted by this Agreement in relation to the Confidential Information.` },

  { kind: "heading", text: "Return of Confidential Information" },
  { kind: "numbered", marker: "19.", text: `The Employee agrees that, upon request of the Company, or in the event that the Employee ceases to require use of the Confidential Information, or upon expiration or termination of this Agreement, or the expiration or termination of the Employment, the Employee will turn over to the Company all documents, disks or other computer media, or other material in the possession or control of the Employee that:` },
  { kind: "numbered", marker: "a.", indent: 18, text: `may contain or be derived from ideas, concepts, creations, or trade secrets and other proprietary and Confidential Information as defined in this Agreement; or` },
  { kind: "numbered", marker: "b.", indent: 18, text: `is connected with or derived from the Employee's services to the Company.` },

  { kind: "heading", text: "Notices" },
  { kind: "numbered", marker: "20.", text: `In the event that the Employee is required in a civil, criminal or regulatory proceeding to disclose any part of the Confidential Information, the Employee will give to the Company prompt written notice of such request so the Company may seek an appropriate remedy or alternatively to waive the Employee's compliance with the provisions of this Agreement in regards to the request.` },
  { kind: "numbered", marker: "21.", text: `If the Employee loses or makes unauthorised disclosure of any of the Confidential Information, the Employee will immediately notify the Company and take all reasonable steps necessary to retrieve the lost or improperly disclosed Confidential Information.` },
  { kind: "numbered", marker: "22.", text: `Any notices or delivery required in this Agreement will be deemed completed when hand delivered, delivered by agent, or seven days after being placed in the post, postage prepaid, to the parties at the addresses contained in this Agreement or as the parties may later designate in writing.` },
  { kind: "numbered", marker: "23.", text: `The addresses for any notice to be delivered to any of the parties to this Agreement are as follows:` },
  { kind: "numbered", marker: "a.", indent: 18, text: `Name: Rhinon Tech, Address: Hanuman Nagar 1st Lane, Medical Bank Colony, Berhampur, Ganjam – 760004` },
  { kind: "numbered", marker: "b.", indent: 18, text: `Name: {{employee.legalName}}, Address: {{employee.workLocationOrIndia}}` },

  { kind: "heading", text: "Representations" },
  { kind: "numbered", marker: "24.", text: `In providing the Confidential Information, the Company makes no representations, either expressly or impliedly as to its adequacy, sufficiency, completeness, correctness or its lack of defect of any kind, including any patent or trade mark infringement that may result from the use of such information.` },

  { kind: "heading", text: "Termination" },
  { kind: "numbered", marker: "25.", text: `This Agreement will automatically terminate on the date that the Employee's employment with the Company terminates or expires, as the case may be. Except as otherwise provided in this Agreement, all rights and obligations under this Agreement will terminate at that time.` },

  { kind: "heading", text: "Assignment" },
  { kind: "numbered", marker: "26.", text: `Except where a party has changed its corporate name or merged with another corporation, this Agreement may not be assigned or otherwise transferred by either party in whole or part without the prior written consent of the other party to this Agreement.` },

  { kind: "heading", text: "Amendments" },
  { kind: "numbered", marker: "27.", text: `This Agreement may only be amended or modified by a written instrument executed by both the Company and the Employee.` },

  { kind: "heading", text: "Governing Law" },
  { kind: "numbered", marker: "28.", text: `This Agreement will be construed in accordance with and governed by the laws of Odisha.` },

  { kind: "heading", text: "General Provisions" },
  { kind: "numbered", marker: "29.", text: `Time is of the essence in this Agreement.` },
  { kind: "numbered", marker: "30.", text: `This Agreement may be executed in counterpart.` },
  { kind: "numbered", marker: "31.", text: `Headings are inserted for the convenience of the parties only and are not to be considered when interpreting this Agreement. Words in the singular mean and include the plural and vice versa. Words in the masculine mean and include the feminine and vice versa.` },
  { kind: "numbered", marker: "32.", text: `The clauses, paragraphs, and subparagraphs contained in this Agreement are intended to be read and construed independently of each other. If any part of this Agreement is held to be invalid, this invalidity will not affect the operation of any other part of this Agreement.` },
  { kind: "numbered", marker: "33.", text: `The Employee is liable for all costs, expenses and expenditures including, and without limitation, the complete legal costs incurred by the Company in enforcing this Agreement as a result of any default of this Agreement by the Employee.` },
  { kind: "numbered", marker: "34.", text: `The Company and the Employee acknowledge that this Agreement is reasonable, valid and enforceable. However, if a court of competent jurisdiction finds any of the provisions of this Agreement to be too broad to be enforceable, it is the intention of the Company and the Employee that such provision be reduced in scope by the court only to the extent deemed necessary by that court to render the provision reasonable and enforceable, bearing in mind that it is the intention of the Employee to give the Company the broadest possible protection against disclosure of the Confidential Information.` },
  { kind: "numbered", marker: "35.", text: `No failure or delay by the Company in exercising any power, right or privilege provided in this Agreement will operate as a waiver, nor will any single or partial exercise of such rights, powers or privileges preclude any further exercise of them or the exercise of any other right, power or privilege provided in this Agreement.` },
  { kind: "numbered", marker: "36.", text: `This Agreement will inure to the benefit of and be binding upon the respective heirs, executors, administrators, successors and assigns, as the case may be, of the Company and the Employee.` },
  { kind: "numbered", marker: "37.", text: `This Agreement constitutes the entire agreement between the parties and there are no further items or provisions, either oral or otherwise.` },
];

const TEMPLATES: { key: LetterTemplateKey; category: "offer_letter" | "nda"; title: string; blocks: BlockInput[] }[] = [
  { key: "offer_letter_fulltime", category: "offer_letter", title: "Offer Letter — Full-Time", blocks: OFFER_LETTER_FULLTIME },
  { key: "offer_letter_intern", category: "offer_letter", title: "Offer Letter — Intern", blocks: OFFER_LETTER_INTERN },
  { key: "nda", category: "nda", title: "Non-Disclosure Agreement", blocks: NDA },
];

async function seedLetterTemplates() {
  await syncDatabase();
  for (const t of TEMPLATES) {
    const [row, created] = await LetterTemplate.findOrCreate({
      where: { key: t.key },
      defaults: { key: t.key, category: t.category, title: t.title, blocks: withIds(t.key.replace(/_/g, "-"), t.blocks), version: 1 },
    });
    console.log(`${created ? "Created" : "Already exists"}: ${row.key} (${row.blocks.length} blocks)`);
  }
  await sequelize.close();
  console.log("Letter templates seed complete.");
}

seedLetterTemplates().catch((err) => {
  console.error("Letter templates seed failed:", err);
  process.exit(1);
});
