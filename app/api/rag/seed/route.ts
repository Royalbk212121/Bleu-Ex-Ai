import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST() {
  try {
    // First, let's seed some sample legal documents
    const sampleDocuments = [
      {
        title: "Miranda v. Arizona - Supreme Court Decision",
        content: `Miranda v. Arizona, 384 U.S. 436 (1966), was a landmark decision of the U.S. Supreme Court in which the Court ruled that the Fifth Amendment to the U.S. Constitution restricts prosecutors from using a person's statements made in response to interrogation in police custody as evidence at their trial unless they can show that the person was informed of the right to consult with an attorney before and during questioning, and of the right against self-incrimination before police questioning, and that the defendant not only understood these rights but voluntarily waived them.

The Miranda warning (also referred to as Miranda rights) is a right to silence warning given by police in the United States to criminal suspects in police custody (or in a custodial interrogation) before they are interrogated to preserve the admissibility of their statements against them in criminal proceedings.

The Supreme Court decided Miranda by a 5–4 majority. Chief Justice Earl Warren wrote the opinion for the majority. The Court held that both inculpatory and exculpatory statements made in response to interrogation by a defendant in police custody will be inadmissible at trial unless the prosecution can show that the defendant was informed of the right to consult with an attorney before and during questioning and of the right against self-incrimination prior to questioning by police, and that the defendant not only understood these rights, but voluntarily waived them.`,
        summary: "Landmark Supreme Court case establishing Miranda rights for criminal suspects in police custody.",
        document_type: "SCOTUS",
        jurisdiction: "US",
        practice_area: "CRIM",
        source: "Supreme Court Database",
        citations: ["384 U.S. 436 (1966)"],
        key_terms: ["Miranda rights", "Fifth Amendment", "self-incrimination", "police custody", "interrogation"],
      },
      {
        title: "Brown v. Board of Education - Desegregation Decision",
        content: `Brown v. Board of Education of Topeka, 347 U.S. 483 (1954), was a landmark decision of the U.S. Supreme Court, which ruled that U.S. state laws establishing racial segregation in public schools are unconstitutional, even if the segregated schools are otherwise equal in quality.

The decision partially overruled the Court's 1896 decision Plessy v. Ferguson, which had held that racial segregation laws did not violate the U.S. Constitution as long as the facilities for each race were equal in quality, a doctrine that had come to be known as "separate but equal".

The Court's decision in Brown paved the way for integration and was a major victory of the civil rights movement, and a model for many future impact litigation cases. However, the decision's fourteen pages did not spell out any sort of method for ending racial segregation in schools, and the Court's second decision in Brown II (1955) only ordered that the desegregation of American public schools should occur "with all deliberate speed".`,
        summary: "Supreme Court decision declaring racial segregation in public schools unconstitutional.",
        document_type: "SCOTUS",
        jurisdiction: "US",
        practice_area: "CIVIL",
        source: "Supreme Court Database",
        citations: ["347 U.S. 483 (1954)", "Plessy v. Ferguson, 163 U.S. 537 (1896)"],
        key_terms: ["desegregation", "equal protection", "Fourteenth Amendment", "separate but equal", "civil rights"],
      },
      {
        title: "Contract Law Fundamentals - Offer and Acceptance",
        content: `A contract is a legally enforceable agreement between two or more parties. The formation of a contract requires several essential elements: offer, acceptance, consideration, and mutual assent (meeting of the minds).

An offer is a promise or commitment to do or refrain from doing some specified thing in the future. The offer must be communicated to the offeree and must be sufficiently definite and certain in its terms. The offeror (person making the offer) must have a serious intention to become bound by the offer.

Acceptance is the offeree's assent to the terms of the offer. Under the common law "mirror image rule," the acceptance must be on the exact terms proposed by the offer. Any variation in terms constitutes a counteroffer rather than an acceptance.

The mailbox rule states that acceptance is effective when sent (if properly addressed and stamped), not when received. However, this rule only applies to acceptances, not to offers, revocations, or rejections.

Consideration is something of value that is exchanged between the parties. It can be a promise to do something, a promise to refrain from doing something, or the actual performance of an act. Past consideration is generally not sufficient to support a contract.`,
        summary: "Fundamental principles of contract formation including offer, acceptance, and consideration.",
        document_type: "MEMO",
        jurisdiction: "US",
        practice_area: "CONTRACT",
        source: "Legal Education Materials",
        citations: [],
        key_terms: ["contract formation", "offer", "acceptance", "consideration", "mailbox rule", "mirror image rule"],
      },
      {
        title: "Fourth Amendment Search and Seizure Protections",
        content: `The Fourth Amendment to the United States Constitution protects against unreasonable searches and seizures. It requires government officials to obtain a warrant based on probable cause before conducting most searches.

The amendment states: "The right of the people to be secure in their persons, houses, papers, and effects, against unreasonable searches and seizures, shall not be violated, and no Warrants shall issue, but upon probable cause, supported by Oath or affirmation, and particularly describing the place to be searched, and the persons or things to be seized."

Key concepts include:

1. Reasonable Expectation of Privacy: Courts use the Katz test to determine whether a person has a reasonable expectation of privacy in a particular situation.

2. Warrant Requirement: Generally, searches must be conducted pursuant to a warrant issued by a neutral magistrate based on probable cause.

3. Exceptions to Warrant Requirement: Several exceptions exist, including consent searches, searches incident to arrest, automobile searches, plain view doctrine, and exigent circumstances.

4. Exclusionary Rule: Evidence obtained in violation of the Fourth Amendment is generally inadmissible in court, though exceptions like the good faith exception and inevitable discovery doctrine may apply.

The Supreme Court has continually refined Fourth Amendment jurisprudence to address new technologies and changing societal expectations of privacy.`,
        summary: "Overview of Fourth Amendment protections against unreasonable searches and seizures.",
        document_type: "MEMO",
        jurisdiction: "US",
        practice_area: "CONST",
        source: "Constitutional Law Materials",
        citations: ["Katz v. United States, 389 U.S. 347 (1967)"],
        key_terms: [
          "Fourth Amendment",
          "search and seizure",
          "probable cause",
          "warrant requirement",
          "exclusionary rule",
          "reasonable expectation of privacy",
        ],
      },
      {
        title: "Negligence in Tort Law - Elements and Standards",
        content: `Negligence is a tort that occurs when a person breaches their duty of care, causing harm to another person. To establish a negligence claim, a plaintiff must prove four essential elements:

1. Duty of Care: The defendant owed a legal duty of care to the plaintiff. This duty is typically based on the relationship between the parties or the foreseeability of harm.

2. Breach of Duty: The defendant breached that duty by failing to conform to the required standard of care. The standard is typically that of a reasonable person under similar circumstances.

3. Causation: The defendant's breach of duty was both the factual cause (but-for causation) and the proximate cause (legal cause) of the plaintiff's harm.

4. Damages: The plaintiff suffered actual harm or damages as a result of the defendant's breach.

The reasonable person standard is an objective test that asks what a hypothetical reasonable person would have done under the same or similar circumstances. This standard may be modified for professionals (who are held to the standard of their profession) or for people with disabilities.

Defenses to negligence include contributory negligence, comparative negligence, and assumption of risk. Most jurisdictions have adopted some form of comparative negligence, which reduces the plaintiff's recovery based on their percentage of fault.`,
        summary: "Elements and standards for establishing negligence claims in tort law.",
        document_type: "MEMO",
        jurisdiction: "US",
        practice_area: "TORT",
        source: "Tort Law Materials",
        citations: [],
        key_terms: [
          "negligence",
          "duty of care",
          "breach of duty",
          "causation",
          "damages",
          "reasonable person standard",
          "comparative negligence",
        ],
      },
    ]

    // Insert documents into the database
    let processedCount = 0
    const results = []

    for (const doc of sampleDocuments) {
      try {
        const { data, error } = await supabase.from("legal_documents").insert([doc]).select()

        if (error) {
          console.error("Error inserting document:", error)
          results.push({ title: doc.title, success: false, error: error.message })
        } else {
          processedCount++
          results.push({ title: doc.title, success: true, id: data[0]?.id })
        }
      } catch (error) {
        console.error("Error processing document:", error)
        results.push({ title: doc.title, success: false, error: "Processing error" })
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      total: sampleDocuments.length,
      results,
      message: `Successfully seeded ${processedCount} legal documents`,
    })
  } catch (error) {
    console.error("Seeding error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to seed database",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
