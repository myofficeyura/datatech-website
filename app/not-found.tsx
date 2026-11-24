import Link from "next/link";
export default function NotFound() {
  return (
    <div className="panel empty" style={{ marginTop: 40 }}>
      <h1 style={{ fontSize: 48 }}>404</h1>
      <p>Bu səhifə tapılmadı. / Page not found.</p>
      <Link className="btn pri sm" href="/">Ana səhifə</Link>
    </div>
  );
}
