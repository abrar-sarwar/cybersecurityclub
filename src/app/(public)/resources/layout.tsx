// The guides are laid out like the career and project pages, so they share that stylesheet.
import "../careers/careers.css";

export default function ResourcesLayout({ children }: LayoutProps<"/resources">) {
  return <div className="careers-shell">{children}</div>;
}
