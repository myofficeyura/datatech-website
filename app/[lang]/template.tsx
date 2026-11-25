// Səhifələr arası keçid animasiyası (CSS: ilk açılışda da işləyir, JS gözləmir).
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
