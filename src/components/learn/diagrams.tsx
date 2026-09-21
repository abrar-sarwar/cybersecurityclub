import type { DiagramId } from "@/content/schemas";

/**
 * Built-in SVG diagrams referenced from lesson frontmatter (`diagram: id`) or
 * from a ```diagram fenced block. Each is a simple, legible figure in the site
 * palette with a text caption for screen readers.
 */

const B = "#8AACFF";
const N = "#F3F6FC";
const P = "#172B4F";
const L = "#51627F";
const C = "#0EA5C6";
const M = "#B4BFD2";

function Box({ x, y, w, h, label, sub, fill = "#0d1829", stroke = B }: { x: number; y: number; w: number; h: number; label: string; sub?: string; fill?: string; stroke?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={fill} stroke={stroke} strokeWidth={1.5} />
      <text x={x + w / 2} y={y + (sub ? h / 2 - 4 : h / 2 + 5)} textAnchor="middle" fontSize={14} fontWeight={600} fill={N}>
        {label}
      </text>
      {sub ? (
        <text x={x + w / 2} y={y + h / 2 + 14} textAnchor="middle" fontSize={11.5} fill={M}>
          {sub}
        </text>
      ) : null}
    </g>
  );
}

function Arrow({ x1, y1, x2, y2, dashed = false }: { x1: number; y1: number; x2: number; y2: number; dashed?: boolean }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={B} strokeWidth={1.6} strokeDasharray={dashed ? "5 4" : undefined} markerEnd="url(#arr)" />;
}

function Defs() {
  return (
    <defs>
      <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
        <path d="M0 0 10 5 0 10z" fill={B} />
      </marker>
    </defs>
  );
}

function Frame({ title, caption, viewBox, children }: { title: string; caption: string; viewBox: string; children: React.ReactNode }) {
  return (
    <figure className="not-prose my-8 rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-6">
      <svg viewBox={viewBox} role="img" aria-labelledby={`${title.replace(/\W+/g, "-")}-t ${title.replace(/\W+/g, "-")}-d`} className="h-auto w-full font-sans">
        <title id={`${title.replace(/\W+/g, "-")}-t`}>{title}</title>
        <desc id={`${title.replace(/\W+/g, "-")}-d`}>{caption}</desc>
        <Defs />
        {children}
      </svg>
      <figcaption className="mt-3 text-sm text-muted">{caption}</figcaption>
    </figure>
  );
}

function Flow({ steps, title, caption }: { steps: { label: string; sub?: string }[]; title: string; caption: string }) {
  const w = 150;
  const gap = 34;
  const total = steps.length * w + (steps.length - 1) * gap + 20;
  return (
    <Frame title={title} caption={caption} viewBox={`0 0 ${total} 110`}>
      {steps.map((s, i) => {
        const x = 10 + i * (w + gap);
        return (
          <g key={s.label}>
            <Box x={x} y={25} w={w} h={60} label={s.label} sub={s.sub} fill={i % 2 === 0 ? "#0d1829" : P} />
            {i < steps.length - 1 ? <Arrow x1={x + w + 3} y1={55} x2={x + w + gap - 3} y2={55} /> : null}
          </g>
        );
      })}
    </Frame>
  );
}

function Cycle({ steps, title, caption }: { steps: string[]; title: string; caption: string }) {
  const cx = 200;
  const cy = 170;
  const r = 118;
  const pts = steps.map((_, i) => {
    const a = (Math.PI * 2 * i) / steps.length - Math.PI / 2;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
  return (
    <Frame title={title} caption={caption} viewBox="0 0 400 340">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={L} strokeWidth={2} strokeDasharray="4 6" />
      {pts.map((p, i) => {
        const next = pts[(i + 1) % pts.length];
        const mx = (p.x + next.x) / 2;
        const my = (p.y + next.y) / 2;
        const dx = mx - cx;
        const dy = my - cy;
        const len = Math.hypot(dx, dy) || 1;
        const ox = cx + (dx / len) * r;
        const oy = cy + (dy / len) * r;
        return <path key={i} d={`M ${ox - 6} ${oy - 6} L ${ox + 2} ${oy} L ${ox - 6} ${oy + 6}`} fill="none" stroke={B} strokeWidth={1.6} transform={`rotate(${(Math.atan2(dy, dx) * 180) / Math.PI} ${ox} ${oy})`} />;
      })}
      {pts.map((p, i) => (
        <g key={steps[i]}>
          <rect x={p.x - 62} y={p.y - 20} width={124} height={40} rx={10} fill={i === 0 ? B : "#0d1829"} stroke={B} strokeWidth={1.5} />
          <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize={13} fontWeight={600} fill={i === 0 ? "#0d1829" : N}>
            {steps[i]}
          </text>
        </g>
      ))}
    </Frame>
  );
}

export function Diagram({ id }: { id: DiagramId }) {
  switch (id) {
    case "alert-lifecycle":
      return (
        <Flow
          title="The life of an alert"
          caption="A raw event becomes an alert when a detection rule fires. An analyst triages it, and only confirmed, impactful alerts become incidents that go through response."
          steps={[
            { label: "Event", sub: "log line" },
            { label: "Alert", sub: "rule fired" },
            { label: "Triage", sub: "true or false?" },
            { label: "Incident", sub: "confirmed" },
            { label: "Response", sub: "contain, fix" },
          ]}
        />
      );
    case "incident-response-phases":
      return (
        <Cycle
          title="Incident response lifecycle"
          caption="Preparation feeds detection and analysis; containment, eradication and recovery follow; lessons learned improve preparation for the next incident."
          steps={["Preparation", "Detection & analysis", "Containment", "Eradication & recovery", "Lessons learned"]}
        />
      );
    case "cia-triad":
      return (
        <Frame title="The CIA triad" caption="Confidentiality, integrity and availability are the three properties security controls protect. Most decisions trade one against another." viewBox="0 0 400 300">
          <polygon points="200,40 60,260 340,260" fill={P} stroke={B} strokeWidth={2} />
          <Box x={140} y={18} w={120} h={44} label="Confidentiality" sub="only the right people" />
          <Box x={8} y={238} w={130} h={44} label="Integrity" sub="not tampered with" />
          <Box x={262} y={238} w={130} h={44} label="Availability" sub="there when needed" />
          <text x={200} y={170} textAnchor="middle" fontSize={13} fill={M}>
            security decisions balance all three
          </text>
        </Frame>
      );
    case "network-layers":
      return (
        <Frame title="Network layers" caption="The OSI model (7 layers) next to the TCP/IP model (4 layers). Data moves down the stack when sending and up when receiving." viewBox="0 0 520 330">
          {["Application", "Presentation", "Session", "Transport", "Network", "Data link", "Physical"].map((l, i) => (
            <g key={l}>
              <rect x={20} y={20 + i * 41} width={200} height={36} rx={8} fill={i < 3 ? P : "#0d1829"} stroke={B} strokeWidth={1.4} />
              <text x={34} y={43 + i * 41} fontSize={13} fontWeight={600} fill={N}>
                {7 - i}. {l}
              </text>
            </g>
          ))}
          {[
            { l: "Application", y: 20, h: 118, ex: "HTTP, DNS, TLS" },
            { l: "Transport", y: 143, h: 36, ex: "TCP, UDP" },
            { l: "Internet", y: 184, h: 36, ex: "IP, ICMP" },
            { l: "Link", y: 225, h: 77, ex: "Ethernet, Wi-Fi" },
          ].map((r) => (
            <g key={r.l}>
              <rect x={300} y={r.y} width={200} height={r.h} rx={8} fill="#0d1829" stroke={C} strokeWidth={1.6} />
              <text x={314} y={r.y + r.h / 2 + 1} fontSize={13} fontWeight={600} fill={N}>
                {r.l}
              </text>
              <text x={314} y={r.y + r.h / 2 + 16} fontSize={11} fill={M}>
                {r.ex}
              </text>
            </g>
          ))}
          <text x={120} y={322} textAnchor="middle" fontSize={12} fill={M}>
            OSI model
          </text>
          <text x={400} y={322} textAnchor="middle" fontSize={12} fill={M}>
            TCP/IP model
          </text>
        </Frame>
      );
    case "auth-vs-authz":
      return (
        <Flow
          title="Authentication vs authorization"
          caption="Authentication proves who you are (password, passkey, MFA). Authorization decides what that identity may do (roles, policies). Auditing records what happened."
          steps={[
            { label: "Identify", sub: "username" },
            { label: "Authenticate", sub: "prove it" },
            { label: "Authorize", sub: "allowed?" },
            { label: "Audit", sub: "record it" },
          ]}
        />
      );
    case "rbac-matrix":
      return (
        <Frame title="Role-based access matrix" caption="Rows are roles, columns are systems. Each cell states the highest permission a role should have; blank cells mean no access. Fewer filled cells means less privilege to review." viewBox="0 0 520 250">
          {["", "Wiki", "Finance", "Servers", "Member list"].map((h, i) => (
            <text key={h + i} x={i === 0 ? 20 : 100 + i * 90} y={36} textAnchor={i === 0 ? "start" : "middle"} fontSize={13} fontWeight={700} fill={N}>
              {h}
            </text>
          ))}
          {[
            ["Member", "read", "", "", ""],
            ["Volunteer", "edit", "", "", "read"],
            ["Treasurer", "read", "edit", "", "read"],
            ["Officer", "edit", "read", "", "edit"],
            ["Admin", "admin", "admin", "admin", "admin"],
          ].map((row, r) => (
            <g key={row[0]}>
              <rect x={12} y={50 + r * 38} width={496} height={34} rx={8} fill={r % 2 ? P : "#0d1829"} stroke={L} />
              {row.map((cell, c) => (
                <text key={c} x={c === 0 ? 20 : 100 + c * 90} y={72 + r * 38} textAnchor={c === 0 ? "start" : "middle"} fontSize={13} fontWeight={c === 0 ? 600 : 500} fill={cell === "admin" ? "#ffb5bc" : cell ? B : L}>
                  {cell || "-"}
                </text>
              ))}
            </g>
          ))}
        </Frame>
      );
    case "identity-lifecycle":
      return (
        <Cycle
          title="Identity lifecycle"
          caption="Accounts are created when someone joins, changed when their role changes, reviewed regularly, and removed when they leave. Most access problems come from skipped steps."
          steps={["Join (create)", "Change role", "Review access", "Leave (remove)"]}
        />
      );
    case "sdlc-security":
      return (
        <Flow
          title="Security in the development lifecycle"
          caption="Each phase has a matching security activity. Finding an issue early is cheaper than fixing it after release."
          steps={[
            { label: "Design", sub: "threat model" },
            { label: "Code", sub: "review, linting" },
            { label: "Build", sub: "SAST, deps" },
            { label: "Test", sub: "DAST, pen test" },
            { label: "Run", sub: "monitor, patch" },
          ]}
        />
      );
    case "http-request-cycle":
      return (
        <Frame title="How a web request works" caption="The browser resolves a name with DNS, opens a TLS connection, sends an HTTP request, and the server returns a response. Security controls sit at each hop." viewBox="0 0 560 190">
          <Box x={20} y={60} w={130} h={64} label="Browser" sub="your device" />
          <Box x={215} y={60} w={130} h={64} label="DNS + TLS" sub="name, encryption" fill={P} />
          <Box x={410} y={60} w={130} h={64} label="Server" sub="app + database" />
          <Arrow x1={152} y1={80} x2={213} y2={80} />
          <Arrow x1={347} y1={80} x2={408} y2={80} />
          <Arrow x1={408} y1={104} x2={347} y2={104} />
          <Arrow x1={213} y1={104} x2={152} y2={104} />
          <text x={182} y={50} textAnchor="middle" fontSize={11} fill={M}>
            GET /page
          </text>
          <text x={378} y={50} textAnchor="middle" fontSize={11} fill={M}>
            request
          </text>
          <text x={280} y={150} textAnchor="middle" fontSize={11} fill={M}>
            response: HTML, JSON, cookies, headers
          </text>
        </Frame>
      );
    case "threat-model-dfd":
      return (
        <Frame title="Simple threat model data-flow diagram" caption="External entities, processes and data stores, with trust boundaries drawn as dashed lines. Ask what can go wrong wherever data crosses a boundary." viewBox="0 0 560 250">
          <rect x={150} y={20} width={390} height={210} rx={14} fill="none" stroke={C} strokeWidth={1.6} strokeDasharray="6 5" />
          <text x={165} y={40} fontSize={11} fill={C}>
            trust boundary: our infrastructure
          </text>
          <Box x={15} y={95} w={110} h={56} label="User" sub="external" />
          <g>
            <ellipse cx={265} cy={123} rx={70} ry={30} fill={P} stroke={B} strokeWidth={1.5} />
            <text x={265} y={121} textAnchor="middle" fontSize={13} fontWeight={600} fill={N}>
              Web app
            </text>
            <text x={265} y={136} textAnchor="middle" fontSize={11} fill={M}>
              process
            </text>
          </g>
          <g>
            <line x1={400} y1={95} x2={520} y2={95} stroke={B} strokeWidth={1.5} />
            <line x1={400} y1={151} x2={520} y2={151} stroke={B} strokeWidth={1.5} />
            <text x={460} y={121} textAnchor="middle" fontSize={13} fontWeight={600} fill={N}>
              Database
            </text>
            <text x={460} y={136} textAnchor="middle" fontSize={11} fill={M}>
              data store
            </text>
          </g>
          <Arrow x1={127} y1={115} x2={193} y2={115} />
          <Arrow x1={193} y1={132} x2={127} y2={132} />
          <Arrow x1={337} y1={115} x2={398} y2={115} />
          <Arrow x1={398} y1={132} x2={337} y2={132} />
          <text x={160} y={105} textAnchor="middle" fontSize={10.5} fill={M}>
            login, input
          </text>
          <text x={367} y={105} textAnchor="middle" fontSize={10.5} fill={M}>
            queries
          </text>
        </Frame>
      );
    case "home-network-segments":
      return (
        <Frame title="Segmenting a home or lab network" caption="Everyday devices, the lab, and untrusted devices sit in separate segments. Vulnerable lab machines never share a segment with your laptop or phone." viewBox="0 0 560 260">
          <Box x={215} y={18} w={130} h={54} label="Router / firewall" sub="rules between zones" fill={P} />
          <Box x={20} y={150} w={150} h={70} label="Everyday" sub="laptop, phone" />
          <Box x={205} y={150} w={150} h={70} label="Lab (isolated)" sub="VMs, vulnerable apps" />
          <Box x={390} y={150} w={150} h={70} label="Guest / IoT" sub="untrusted devices" />
          <Arrow x1={250} y1={74} x2={110} y2={148} />
          <Arrow x1={280} y1={74} x2={280} y2={148} />
          <Arrow x1={310} y1={74} x2={450} y2={148} />
          <line x1={172} y1={185} x2={203} y2={185} stroke="#ffb5bc" strokeWidth={2} />
          <text x={188} y={178} textAnchor="middle" fontSize={16} fill="#ffb5bc">
            ×
          </text>
          <line x1={357} y1={185} x2={388} y2={185} stroke="#ffb5bc" strokeWidth={2} />
          <text x={372} y={178} textAnchor="middle" fontSize={16} fill="#ffb5bc">
            ×
          </text>
          <text x={280} y={248} textAnchor="middle" fontSize={11.5} fill={M}>
            × = no direct traffic between segments
          </text>
        </Frame>
      );
    case "log-pipeline":
      return (
        <Flow
          title="From logs to alerts"
          caption="Endpoints, servers and cloud services emit logs. A collector normalizes them into a SIEM, where detection rules produce alerts for analysts and dashboards for everyone else."
          steps={[
            { label: "Sources", sub: "endpoints, cloud" },
            { label: "Collect", sub: "agents, syslog" },
            { label: "Normalize", sub: "common fields" },
            { label: "Detect", sub: "rules, analytics" },
            { label: "Alert", sub: "analyst queue" },
          ]}
        />
      );
    case "defense-in-depth":
      return (
        <Frame title="Defense in depth" caption="Layered controls mean one failure does not expose the data. Each ring is a different kind of protection." viewBox="0 0 420 340">
          {[
            { r: 150, l: "Policies & awareness" },
            { r: 118, l: "Network controls" },
            { r: 86, l: "Host hardening" },
            { r: 54, l: "Application" },
          ].map((ring, i) => (
            <g key={ring.l}>
              <circle cx={210} cy={175} r={ring.r} fill={i % 2 ? "#0d1829" : P} stroke={B} strokeWidth={1.5} />
              <text x={210} y={175 - ring.r + 16} textAnchor="middle" fontSize={12} fontWeight={600} fill={N}>
                {ring.l}
              </text>
            </g>
          ))}
          <circle cx={210} cy={175} r={24} fill={B} />
          <text x={210} y={179} textAnchor="middle" fontSize={11} fontWeight={700} fill="#0d1829">
            Data
          </text>
        </Frame>
      );
    default:
      return null;
  }
}
