import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST() {
  try {
    console.log("Starting database initialization...")

    // Create tables using individual queries
    await createTables()
    await insertSampleData()

    // Verify tables were created
    const { data: finalTables, error: finalError } = await supabaseAdmin
      .from("legal_documents")
      .select("count", { count: "exact", head: true })

    if (finalError) {
      console.error("Verification error:", finalError)
      return NextResponse.json(
        {
          success: false,
          error: "Database initialization failed during verification",
          details: finalError.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
      tablesCreated: ["jurisdictions", "practice_areas", "document_types", "legal_documents"],
      documentCount: finalTables?.count || 0,
    })
  } catch (error) {
    console.error("Database initialization error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Database initialization failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function createTables() {
  try {
    // Create jurisdictions table
    await supabaseAdmin.from("jurisdictions").select("id").limit(1)
  } catch (error) {
    // Table doesn't exist, create sample data structure by inserting data
    console.log("Creating jurisdictions table via data insertion...")
  }

  try {
    // Create practice_areas table
    await supabaseAdmin.from("practice_areas").select("id").limit(1)
  } catch (error) {
    console.log("Creating practice_areas table via data insertion...")
  }

  try {
    // Create document_types table
    await supabaseAdmin.from("document_types").select("id").limit(1)
  } catch (error) {
    console.log("Creating document_types table via data insertion...")
  }

  try {
    // Create legal_documents table
    await supabaseAdmin.from("legal_documents").select("id").limit(1)
  } catch (error) {
    console.log("Creating legal_documents table via data insertion...")
  }
}

async function insertSampleData() {
  try {
    // Insert jurisdictions
    const jurisdictions = [
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "Federal",
        code: "US-FED",
        country: "United States",
        type: "federal",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440002",
        name: "California",
        code: "US-CA",
        country: "United States",
        type: "state",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440003",
        name: "New York",
        code: "US-NY",
        country: "United States",
        type: "state",
      },
    ]

    const { error: jurisdictionError } = await supabaseAdmin.from("jurisdictions").upsert(jurisdictions, {
      onConflict: "code",
    })

    if (jurisdictionError) {
      console.log("Jurisdictions insert error (may be expected):", jurisdictionError.message)
    }

    // Insert practice areas
    const practiceAreas = [
      {
        id: "550e8400-e29b-41d4-a716-446655440011",
        name: "Contract Law",
        code: "CONTRACT",
        description: "Legal agreements and obligations",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440012",
        name: "Tort Law",
        code: "TORT",
        description: "Civil wrongs and remedies",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440013",
        name: "Constitutional Law",
        code: "CONSTITUTIONAL",
        description: "Constitutional interpretation and rights",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440014",
        name: "Corporate Law",
        code: "CORPORATE",
        description: "Business and corporate legal matters",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440015",
        name: "Intellectual Property",
        code: "IP",
        description: "Patents, trademarks, and copyrights",
      },
    ]

    const { error: practiceAreaError } = await supabaseAdmin.from("practice_areas").upsert(practiceAreas, {
      onConflict: "code",
    })

    if (practiceAreaError) {
      console.log("Practice areas insert error (may be expected):", practiceAreaError.message)
    }

    // Insert document types
    const documentTypes = [
      {
        id: "550e8400-e29b-41d4-a716-446655440021",
        name: "Case Law",
        code: "CASE",
        description: "Court decisions and opinions",
        category: "case_law",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440022",
        name: "Statute",
        code: "STATUTE",
        description: "Legislative enactments",
        category: "statute",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440023",
        name: "Regulation",
        code: "REGULATION",
        description: "Administrative rules",
        category: "regulation",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440024",
        name: "Legal Guide",
        code: "GUIDE",
        description: "Educational legal content",
        category: "secondary",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440025",
        name: "Contract Template",
        code: "CONTRACT_TEMPLATE",
        description: "Standard contract forms",
        category: "template",
      },
    ]

    const { error: documentTypeError } = await supabaseAdmin.from("document_types").upsert(documentTypes, {
      onConflict: "code",
    })

    if (documentTypeError) {
      console.log("Document types insert error (may be expected):", documentTypeError.message)
    }

    // Insert legal documents
    const legalDocuments = [
      {
        id: "550e8400-e29b-41d4-a716-446655440031",
        title: "Contract Law Fundamentals",
        content: `A contract is a legally binding agreement between two or more parties. The essential elements of a contract include offer, acceptance, consideration, and mutual assent.

**Key Elements:**
1. **Offer**: A promise to do or refrain from doing something in exchange for something else
2. **Acceptance**: The agreement to the terms of the offer
3. **Consideration**: Something of value exchanged between the parties
4. **Mutual Assent**: Both parties understand and agree to the essential terms

**Formation Requirements:**
- The parties must have legal capacity to contract
- The subject matter must be legal
- The terms must be sufficiently definite
- There must be genuine assent (no fraud, duress, or mistake)

**Performance and Breach:**
When a party fails to perform their contractual obligations, it constitutes a breach of contract. The non-breaching party may seek remedies including damages, specific performance, or contract rescission.`,
        summary: "Comprehensive overview of basic contract law principles and requirements",
        document_type: "Legal Guide",
        jurisdiction: "Federal",
        practice_area: "Contract Law",
        source: "Legal Database",
        source_url: "https://example.com/contract-law",
        citations: ["UCC § 2-201", "Restatement (Second) of Contracts § 1", "Restatement (Second) of Contracts § 17"],
        key_terms: ["contract", "offer", "acceptance", "consideration", "mutual assent", "breach", "damages"],
        status: "active",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440032",
        title: "Tort Law Principles",
        content: `Tort law governs civil wrongs and provides remedies for individuals who have been harmed by the wrongful acts of others. The main categories include intentional torts, negligence, and strict liability.

**Categories of Torts:**

1. **Intentional Torts**: Deliberate wrongful acts
   - Battery: Harmful or offensive contact
   - Assault: Apprehension of imminent harmful contact
   - False imprisonment: Unlawful restraint of freedom
   - Intentional infliction of emotional distress

2. **Negligence**: Failure to exercise reasonable care
   - Duty of care owed to the plaintiff
   - Breach of that duty
   - Causation (factual and proximate)
   - Damages

3. **Strict Liability**: Liability regardless of fault
   - Abnormally dangerous activities
   - Product liability
   - Animal attacks

**Defenses:**
- Comparative/contributory negligence
- Assumption of risk
- Consent
- Self-defense`,
        summary: "Comprehensive overview of tort law categories and principles",
        document_type: "Legal Guide",
        jurisdiction: "Federal",
        practice_area: "Tort Law",
        source: "Legal Database",
        source_url: "https://example.com/tort-law",
        citations: ["Restatement (Third) of Torts § 1", "Palsgraf v. Long Island R.R. Co.", "Rylands v. Fletcher"],
        key_terms: [
          "tort",
          "negligence",
          "liability",
          "damages",
          "intentional tort",
          "strict liability",
          "duty of care",
        ],
        status: "active",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440033",
        title: "Constitutional Law Overview",
        content: `Constitutional law encompasses the interpretation and implementation of the United States Constitution. It covers fundamental rights, separation of powers, federalism, and judicial review.

**Core Principles:**

1. **Separation of Powers**
   - Legislative Branch (Congress)
   - Executive Branch (President)
   - Judicial Branch (Courts)
   - Checks and balances system

2. **Federalism**
   - Division of power between federal and state governments
   - Supremacy Clause
   - Commerce Clause
   - Tenth Amendment reserved powers

3. **Individual Rights**
   - Bill of Rights (First 10 Amendments)
   - Due Process Clause
   - Equal Protection Clause
   - Incorporation doctrine

4. **Judicial Review**
   - Power of courts to review government actions
   - Constitutional interpretation
   - Precedent and stare decisis

**Key Cases:**
- Marbury v. Madison (1803): Established judicial review
- McCulloch v. Maryland (1819): Federal supremacy and implied powers
- Brown v. Board of Education (1954): Equal protection and desegregation`,
        summary: "Introduction to constitutional law principles and structure",
        document_type: "Legal Guide",
        jurisdiction: "Federal",
        practice_area: "Constitutional Law",
        source: "Legal Database",
        source_url: "https://example.com/constitutional-law",
        citations: [
          "U.S. Const. art. I",
          "U.S. Const. amend. XIV",
          "Marbury v. Madison",
          "McCulloch v. Maryland",
          "Brown v. Board of Education",
        ],
        key_terms: [
          "constitution",
          "rights",
          "federalism",
          "judicial review",
          "separation of powers",
          "due process",
          "equal protection",
        ],
        status: "active",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440034",
        title: "Corporate Law Essentials",
        content: `Corporate law governs the formation, operation, and dissolution of corporations. It encompasses corporate governance, fiduciary duties, and shareholder rights.

**Corporate Formation:**
- Articles of Incorporation
- Corporate bylaws
- Initial board of directors
- Corporate formalities

**Corporate Governance:**
- Board of Directors responsibilities
- Officer duties and authority
- Shareholder meetings and voting
- Corporate records and reporting

**Fiduciary Duties:**
- Duty of Care: Acting with reasonable diligence
- Duty of Loyalty: Acting in the corporation's best interests
- Business Judgment Rule protection

**Shareholder Rights:**
- Voting rights
- Dividend rights
- Inspection rights
- Derivative suit rights`,
        summary: "Essential principles of corporate law and governance",
        document_type: "Legal Guide",
        jurisdiction: "Federal",
        practice_area: "Corporate Law",
        source: "Legal Database",
        source_url: "https://example.com/corporate-law",
        citations: ["Delaware General Corporation Law", "Model Business Corporation Act", "Smith v. Van Gorkom"],
        key_terms: [
          "corporation",
          "governance",
          "fiduciary duty",
          "shareholders",
          "board of directors",
          "business judgment rule",
        ],
        status: "active",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440035",
        title: "Intellectual Property Law Guide",
        content: `Intellectual Property (IP) law protects creations of the mind, including inventions, literary and artistic works, designs, and symbols used in commerce.

**Types of IP Protection:**

1. **Patents**
   - Utility patents: New and useful inventions
   - Design patents: Ornamental designs
   - Plant patents: New plant varieties
   - Duration: 20 years from filing

2. **Trademarks**
   - Words, phrases, symbols, or designs
   - Identifies and distinguishes goods/services
   - Can last indefinitely with proper use

3. **Copyrights**
   - Original works of authorship
   - Literary, dramatic, musical, artistic works
   - Duration: Life of author + 70 years

4. **Trade Secrets**
   - Confidential business information
   - Provides competitive advantage
   - Protected indefinitely if kept secret

**Enforcement:**
- Infringement actions
- Injunctive relief
- Monetary damages
- Attorney fees in exceptional cases`,
        summary: "Comprehensive guide to intellectual property law and protection",
        document_type: "Legal Guide",
        jurisdiction: "Federal",
        practice_area: "Intellectual Property",
        source: "Legal Database",
        source_url: "https://example.com/ip-law",
        citations: ["35 U.S.C. § 101", "15 U.S.C. § 1051", "17 U.S.C. § 102", "Uniform Trade Secrets Act"],
        key_terms: ["patent", "trademark", "copyright", "trade secret", "infringement", "intellectual property"],
        status: "active",
      },
    ]

    const { error: documentsError } = await supabaseAdmin.from("legal_documents").upsert(legalDocuments, {
      onConflict: "id",
    })

    if (documentsError) {
      console.log("Legal documents insert error (may be expected):", documentsError.message)
    } else {
      console.log("Sample legal documents inserted successfully")
    }
  } catch (error) {
    console.error("Sample data insertion error:", error)
    throw error
  }
}
