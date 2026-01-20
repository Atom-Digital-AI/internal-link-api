interface GuideModalProps {
  onClose: () => void;
}

export function GuideModal({ onClose }: GuideModalProps) {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="guide-modal">
      <div className="guide-content">
        <div className="guide-header">
          <h2>User Guide</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        {/* Table of Contents */}
        <nav className="guide-toc">
          <button onClick={() => scrollToSection('getting-started')}>Getting Started</button>
          <button onClick={() => scrollToSection('configure')}>Configure Domain</button>
          <button onClick={() => scrollToSection('select-pages')}>Select Pages</button>
          <button onClick={() => scrollToSection('review-results')}>Review Results</button>
          <button onClick={() => scrollToSection('ai-suggestions')}>AI Suggestions</button>
          <button onClick={() => scrollToSection('managing-work')}>Managing Work</button>
          <button onClick={() => scrollToSection('best-practices')}>Best Practices</button>
          <button onClick={() => scrollToSection('faq')}>FAQ</button>
        </nav>

        <div className="guide-body">
          {/* Getting Started */}
          <section id="getting-started" className="guide-section">
            <h3>Getting Started</h3>

            <h4>What is Internal Linking?</h4>
            <p>
              Internal links connect pages within your website. They help visitors navigate your content
              and help search engines understand your site structure. Good internal linking improves
              both user experience and SEO performance.
            </p>

            <h4>What This Tool Does</h4>
            <p>
              The Internal Link Finder analyzes your website content and suggests opportunities to add
              internal links. It uses AI to find natural places in your text where linking to other
              pages on your site would be relevant and helpful.
            </p>

            <div className="guide-tip">
              <strong>Requirement:</strong> Your website needs an XML sitemap (usually at
              <code>/sitemap.xml</code>) for this tool to discover your pages.
            </div>
          </section>

          {/* Configure Domain */}
          <section id="configure" className="guide-section">
            <h3>Step 1: Configure Your Domain</h3>

            <h4>Website Domain</h4>
            <p>
              Enter your website's full URL including the protocol (e.g., <code>https://example.com</code>).
              The tool will fetch your sitemap to find all available pages.
            </p>

            <h4>Source Pattern</h4>
            <p>
              This pattern identifies which pages you want to <strong>analyze for missing links</strong>.
              The tool will scan these pages for opportunities to add internal links.
            </p>
            <ul>
              <li><code>/blog/</code> - Matches all blog posts</li>
              <li><code>/articles/</code> - Matches all articles</li>
              <li><code>/guides/</code> - Matches all guide pages</li>
              <li>Leave empty to include all pages</li>
            </ul>

            <h4>Target Pattern</h4>
            <p>
              This pattern identifies which pages you want to <strong>link TO</strong>.
              The AI will suggest links pointing to these target pages.
            </p>
            <ul>
              <li><code>/services/</code> - Suggests links to service pages</li>
              <li><code>/products/</code> - Suggests links to product pages</li>
              <li><code>/features/</code> - Suggests links to feature pages</li>
            </ul>

            <div className="guide-tip">
              <strong>Common Use Case:</strong> Set source pattern to <code>/blog/</code> and target
              pattern to <code>/services/</code> to find opportunities to link from blog posts to
              your service pages.
            </div>
          </section>

          {/* Select Pages */}
          <section id="select-pages" className="guide-section">
            <h3>Step 2: Select Pages to Analyze</h3>

            <p>
              After fetching your sitemap, you'll see a list of pages matching your source pattern.
              Select which pages you want to analyze for internal linking opportunities.
            </p>

            <h4>Selection Tools</h4>
            <ul>
              <li><strong>Select All:</strong> Selects all pages up to the maximum limit</li>
              <li><strong>Select None:</strong> Clears your selection to start fresh</li>
              <li><strong>Individual checkboxes:</strong> Toggle specific pages</li>
            </ul>

            <h4>Page Information</h4>
            <p>
              Each page shows its URL and last modified date (if available in the sitemap).
              Pages are sorted by last modified date, newest first, so recently updated content
              appears at the top.
            </p>

            <div className="guide-warning">
              <strong>Note:</strong> There's a maximum number of pages you can analyze at once.
              Start with your most important or recently updated pages.
            </div>
          </section>

          {/* Review Results */}
          <section id="review-results" className="guide-section">
            <h3>Step 3: Review Analysis Results</h3>

            <h4>Summary Statistics</h4>
            <p>After analysis, you'll see a summary showing:</p>
            <ul>
              <li><strong>Scanned:</strong> Total pages analyzed</li>
              <li><strong>Need Links:</strong> Pages with low link density that would benefit from more internal links</li>
              <li><strong>Good:</strong> Pages with adequate internal linking</li>
              <li><strong>Failed:</strong> Pages that couldn't be analyzed (usually due to access issues)</li>
            </ul>

            <h4>Status Meanings</h4>
            <table className="guide-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Meaning</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="guide-status guide-status--needs">Needs Links</span></td>
                  <td>Low link density - good candidate for adding internal links</td>
                </tr>
                <tr>
                  <td><span className="guide-status guide-status--good">Good</span></td>
                  <td>Adequate link density - internal linking is already healthy</td>
                </tr>
              </tbody>
            </table>

            <h4>Link Density</h4>
            <p>
              Link density measures how many internal links exist relative to the content length.
              Pages with very few links compared to their word count are flagged as "Needs Links".
            </p>

            <h4>Save and Refresh</h4>
            <ul>
              <li><strong>Save:</strong> Stores your analysis session in the browser for later access</li>
              <li><strong>Refresh:</strong> Re-analyzes all pages with fresh data from your website</li>
            </ul>
          </section>

          {/* AI Suggestions */}
          <section id="ai-suggestions" className="guide-section">
            <h3>Step 4: Get AI Suggestions</h3>

            <p>
              Click on any page in the results table to open the detailed view. Then click
              "Get AI Suggestions" to have the AI analyze the content for linking opportunities.
            </p>

            <h4>Understanding Suggestion Cards</h4>
            <p>Each suggestion card shows:</p>
            <ul>
              <li><strong>Link text:</strong> The anchor text to use for the link</li>
              <li><strong>Link to:</strong> The target page URL</li>
              <li><strong>Why:</strong> The AI's reasoning for this suggestion</li>
              <li><strong>Context:</strong> The sentence where the link would be placed</li>
            </ul>

            <h4>Taking Action on Suggestions</h4>
            <table className="guide-table">
              <thead>
                <tr>
                  <th>Button</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Copy Code</strong></td>
                  <td>Copies the HTML link code to your clipboard</td>
                </tr>
                <tr>
                  <td><strong>Save</strong></td>
                  <td>Adds the suggestion to your Saved Links list for later</td>
                </tr>
                <tr>
                  <td><strong>Accept</strong></td>
                  <td>Marks as approved (highlighted green in preview)</td>
                </tr>
                <tr>
                  <td><strong>Ignore</strong></td>
                  <td>Dismisses the suggestion (can be reset later)</td>
                </tr>
                <tr>
                  <td><strong>Reset</strong></td>
                  <td>Undoes your accept/ignore decision</td>
                </tr>
              </tbody>
            </table>

            <h4>Article Preview</h4>
            <p>
              The left panel shows your article content with suggestions highlighted:
            </p>
            <ul>
              <li><span className="guide-highlight guide-highlight--yellow">Yellow:</span> Pending suggestions</li>
              <li><span className="guide-highlight guide-highlight--green">Green:</span> Accepted suggestions</li>
              <li>Click any highlight to jump to its suggestion card</li>
            </ul>
          </section>

          {/* Managing Work */}
          <section id="managing-work" className="guide-section">
            <h3>Managing Your Work</h3>

            <h4>Saved Sessions</h4>
            <p>
              Save your analysis session to return to it later. Sessions store your domain settings,
              selected pages, and all analysis results. Access saved sessions from the header button.
            </p>

            <h4>Saved Links</h4>
            <p>
              Build a list of links to implement by clicking "Save" on suggestion cards.
              The Saved Links panel lets you:
            </p>
            <ul>
              <li>Filter links by domain</li>
              <li>Mark links as implemented when you've added them</li>
              <li>Export your list as a CSV file</li>
              <li>Delete individual links or clear all</li>
            </ul>

            <h4>CSV Export</h4>
            <p>
              Export your saved links to a CSV file for use in spreadsheets or content management
              systems. The export includes:
            </p>
            <ul>
              <li>Source page URL and title</li>
              <li>Target URL</li>
              <li>Suggested anchor text</li>
              <li>Context sentence</li>
              <li>Implementation status</li>
            </ul>

            <h4>Implementation Tracking</h4>
            <p>
              Check the "Done" box next to saved links as you implement them. This helps you
              track progress and avoid duplicating work.
            </p>
          </section>

          {/* Best Practices */}
          <section id="best-practices" className="guide-section">
            <h3>Best Practices</h3>

            <h4>Prioritize High-Traffic Pages</h4>
            <p>
              Start with your most visited pages. Adding internal links to popular content
              helps distribute traffic to other important pages.
            </p>

            <h4>Focus on Relevance</h4>
            <p>
              Only add links where they genuinely help the reader. Irrelevant links frustrate
              users and can harm your SEO.
            </p>

            <h4>Use Natural Anchor Text</h4>
            <p>
              The AI suggests anchor text that fits naturally in your content. Avoid generic
              phrases like "click here" - descriptive anchor text helps both users and search engines.
            </p>

            <h4>Don't Over-Link</h4>
            <p>
              More links aren't always better. Too many links on a page can overwhelm readers
              and dilute the value passed to each linked page. Aim for quality over quantity.
            </p>

            <div className="guide-tip">
              <strong>Pro Tip:</strong> Review AI suggestions critically. The AI provides good
              starting points, but use your judgment about what makes sense for your content
              and audience.
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="guide-section">
            <h3>Frequently Asked Questions</h3>

            <h4>Why can't the tool find my sitemap?</h4>
            <p>
              Ensure your sitemap is accessible at <code>/sitemap.xml</code> or check if it's
              listed in your <code>/robots.txt</code> file. Some sites use different sitemap locations
              or require authentication.
            </p>

            <h4>Why are some suggestions marked "Could not locate in article"?</h4>
            <p>
              The AI suggests links based on page content, but sometimes the exact phrase isn't
              found when highlighting. This can happen if the content has special formatting or
              the text differs slightly from what was analyzed.
            </p>

            <h4>How often should I run this analysis?</h4>
            <p>
              Run the analysis whenever you publish new content or make significant updates.
              A monthly review of your top pages is a good practice.
            </p>

            <h4>Are my sessions stored securely?</h4>
            <p>
              Sessions and saved links are stored locally in your browser's localStorage.
              They are not sent to any server and remain private to your device.
            </p>

            <h4>Can I analyze competitor websites?</h4>
            <p>
              The tool only works with websites where you have access to implement the suggested
              links. It's designed for analyzing and improving your own site's internal linking.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
