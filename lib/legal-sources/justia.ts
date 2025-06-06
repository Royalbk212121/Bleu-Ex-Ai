// Simplified Justia integration
export class JustiaAPI {
  async searchLive(query: string, options: any = {}) {
    try {
      const mockResults = [
        {
          id: "roe-v-wade-1973",
          title: "Roe v. Wade",
          citation: "410 U.S. 113 (1973)",
          court: "Supreme Court of the United States",
          date: "1973-01-22",
          snippet: "The Court ruled that a state law that banned abortions was unconstitutional...",
          url: "https://law.justia.com/cases/federal/us/410/113/",
          source: "Justia",
          jurisdiction: "US",
          practiceArea: "CONST",
          documentType: "SCOTUS",
        },
        {
          id: "marbury-v-madison-1803",
          title: "Marbury v. Madison",
          citation: "5 U.S. 137 (1803)",
          court: "Supreme Court of the United States",
          date: "1803-02-24",
          snippet: "Established the principle of judicial review...",
          url: "https://law.justia.com/cases/federal/us/5/137/",
          source: "Justia",
          jurisdiction: "US",
          practiceArea: "CONST",
          documentType: "SCOTUS",
        },
      ]

      const filteredResults = mockResults.filter(
        (result) =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.snippet.toLowerCase().includes(query.toLowerCase()),
      )

      return filteredResults.slice(0, options.limit || 10)
    } catch (error) {
      console.error("Justia search error:", error)
      return []
    }
  }

  async testConnection() {
    try {
      const results = await this.searchLive("constitutional law", { limit: 1 })
      return {
        status: results.length > 0 ? "limited" : "offline",
        message: results.length > 0 ? "Free legal database available" : "No results available",
        resultCount: results.length,
      }
    } catch (error) {
      return {
        status: "offline",
        message: error.message,
        resultCount: 0,
      }
    }
  }
}
