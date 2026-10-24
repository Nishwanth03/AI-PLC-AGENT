
import { useEffect, useState } from "react";
import { checkBackend, generateSCL } from "./services/api";

export default function App() {
  const [requirement, setRequirement] = useState("");
  const [blockName, setBlockName] = useState("FB_PumpControl");
  const [apiOnline, setApiOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;

    async function checkConnection() {
      try {
        await checkBackend();
        if (active) setApiOnline(true);
      } catch {
        if (active) setApiOnline(false);
      }
    }

    checkConnection();
    return () => {
      active = false;
    };
  }, []);

  async function handleGenerate() {
    if (!requirement.trim()) {
      setError("Enter the PLC requirements before generating SCL.");
      return;
    }

    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(blockName.trim())) {
      setError("Use a valid block name, such as FB_PumpControl.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await generateSCL({
        requirement: requirement.trim(),
        blockName: blockName.trim(),
        blockType: "FB",
      });

      setResult(data);
    } catch (err) {
      setError(
        "Could not generate SCL. Check that the backend is running at 127.0.0.1:8000."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!result?.scl_code) return;

    const blob = new Blob([result.scl_code], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${blockName.trim()}.scl`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const sclCode = result?.scl_code || "";
  const status = result?.status || "";

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">PLC</div>
          <div>
            <h1>AI PLC Studio</h1>
            <p>Industrial Logic Engineering Workspace</p>
          </div>
        </div>

        <div className={`connection ${apiOnline ? "online" : "offline"}`}>
          <span className="status-dot" />
          {apiOnline ? "Backend connected" : "Backend disconnected"}
        </div>
      </header>

      <main className="workspace">
        <section className="welcome">
          <div>
            <p className="eyebrow">PLC DEVELOPMENT WORKSPACE</p>
            <h2>Build PLC logic with AI.</h2>
            <p className="welcome-text">
              Describe your automation requirement, generate Siemens SCL,
              review the output, and export the source file.
            </p>
          </div>
          <div className="language-tag">SIEMENS SCL</div>
        </section>

        <section className="workflow">
          <div className="workflow-step active">
            <span>01</span>
            <div><strong>Define</strong><small>Requirements</small></div>
          </div>
          <div className="workflow-line" />
          <div className="workflow-step">
            <span>02</span>
            <div><strong>Generate</strong><small>SCL source</small></div>
          </div>
          <div className="workflow-line" />
          <div className="workflow-step">
            <span>03</span>
            <div><strong>Review</strong><small>Check output</small></div>
          </div>
          <div className="workflow-line" />
          <div className="workflow-step">
            <span>04</span>
            <div><strong>Export</strong><small>SCL file</small></div>
          </div>
        </section>

        <div className="main-grid">
          <section className="panel requirements-panel">
            <div className="panel-heading">
              <div>
                <span className="section-number">01</span>
                <h3>PLC Requirements</h3>
              </div>
              <span className="muted-label">INPUT</span>
            </div>

            <p className="helper">
              Explain what the PLC should do. Include operating conditions,
              interlocks, and fault behavior.
            </p>

            <label htmlFor="requirement">Automation description</label>
            <textarea
              id="requirement"
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              placeholder={"Example:\nCreate pump control logic with Start, Stop and Overload protection.\nStop the pump when overload is detected."}
              rows={8}
            />

            <div className="field-row">
              <div className="field">
                <label htmlFor="blockName">Block name</label>
                <input
                  id="blockName"
                  value={blockName}
                  onChange={(e) => setBlockName(e.target.value)}
                  placeholder="FB_PumpControl"
                />
              </div>

              <div className="field">
                <label htmlFor="blockType">Block type</label>
                <input id="blockType" value="Function Block (FB)" readOnly />
              </div>
            </div>

            <div className="info-note">
              <strong>Before generating</strong>
              <p>
                Clearly specify the inputs, outputs, permissives, fault
                conditions, and expected behavior. Review the generated logic
                before using it in a real PLC project.
              </p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              className="generate-button"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? "Generating SCL..." : "Generate SCL"}
              {!loading && <span aria-hidden="true"> →</span>}
            </button>

            <p className="button-caption">
              Generates code for review. Does not download to a PLC.
            </p>
          </section>

          <section className="panel output-panel">
            <div className="panel-heading">
              <div>
                <span className="section-number">02</span>
                <h3>Generated Output</h3>
              </div>
              <span className="muted-label">OUTPUT</span>
            </div>

            {!result ? (
              <div className="empty-state">
                <div className="empty-icon">&lt;/&gt;</div>
                <h3>Your SCL code will appear here</h3>
                <p>
                  Enter your PLC requirements on the left and select
                  <strong> Generate SCL</strong> to begin.
                </p>
                <div className="empty-checklist">
                  <span>✓ Code preview</span>
                  <span>✓ Warnings and assumptions</span>
                  <span>✓ SCL export</span>
                </div>
              </div>
            ) : (
              <>
                <div className="result-status">
                  <span className="status-dot" />
                  <div>
                    <strong>
                      {status === "needs_clarification"
                        ? "More details required"
                        : "Generation response received"}
                    </strong>
                    <small>
                      {blockName.trim()} · Function Block
                    </small>
                  </div>
                </div>

                {result.message && (
                  <div className="info-note result-message">
                    {result.message}
                  </div>
                )}

                {sclCode ? (
                  <>
                    <div className="code-toolbar">
                      <span>{blockName.trim()}.scl</span>
                      <span>SCL SOURCE</span>
                    </div>
                    <pre className="code-preview">
                      <code>{sclCode}</code>
                    </pre>
                    <button
                      className="export-button"
                      onClick={handleDownload}
                    >
                      ↓ &nbsp; Download SCL file
                    </button>
                  </>
                ) : (
                  <div className="empty-state compact">
                    <h3>No SCL code generated yet</h3>
                    <p>Review the response and clarify the requirements.</p>
                  </div>
                )}

                {Array.isArray(result.assumptions) &&
                  result.assumptions.length > 0 && (
                    <div className="review-section">
                      <h4>Assumptions</h4>
                      <ul>
                        {result.assumptions.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {Array.isArray(result.warnings) &&
                  result.warnings.length > 0 && (
                    <div className="review-section warning-section">
                      <h4>Warnings to review</h4>
                      <ul>
                        {result.warnings.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </>
            )}
          </section>
        </div>

        <footer className="footer">
          <span>AI PLC Studio</span>
          <span>Generate · Review · Export</span>
          <span>PLC deployment requires separate validation and approval.</span>
        </footer>
      </main>
    </div>
  );
}
