import { fetchSheetData } from '../lib/sheets'

function count(rows: string[][], colIdx: number, value: string) {
  return rows.filter(r => r[colIdx] === value).length
}

function Counter(rows: string[][], colIdx: number) {
  const map: Record<string, number> = {}
  rows.forEach(r => {
    const v = r[colIdx] ?? ''
    map[v] = (map[v] ?? 0) + 1
  })
  return map
}

export default async function DashboardPage() {
  let headers: string[] = []
  let rows: string[][] = []
  let error = ''

  try {
    const data = await fetchSheetData()
    headers = data.headers
    rows = data.rows
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : String(e)
  }

  const idx = (name: string) => headers.indexOf(name)

  const 처리상태Idx = idx('처리상태')
  const 지연Idx = idx('지연')
  const 검토Idx = idx('검토필요')
  const 분류Idx = idx('분류')
  const 부서Idx = idx('담당부서')
  const 감정Idx = idx('감정')
  const 발신자Idx = idx('발신자')
  const 경과Idx = idx('경과(일)')
  const linkIdx = idx('Gmail링크')
  const tidIdx = idx('티켓ID')

  const 조치필요 = count(rows, 처리상태Idx, '조치필요')
  const 신규대기 = count(rows, 처리상태Idx, '신규(대기)')
  const 지연건수 = count(rows, 지연Idx, '지연')
  const 검토필요 = count(rows, 검토Idx, '검토필요')
  const 회신완료 = count(rows, 처리상태Idx, '회신완료')
  const total = rows.length

  const 분류Map = Counter(rows, 분류Idx)
  const 부서Map = Counter(rows, 부서Idx)
  const 감정Map = Counter(rows, 감정Idx)
  const 처리Map = Counter(rows, 처리상태Idx)

  const urgent = rows
    .filter(r => ['조치필요', '신규(대기)'].includes(r[처리상태Idx] ?? ''))
    .sort((a, b) => parseFloat(b[경과Idx] ?? '0') - parseFloat(a[경과Idx] ?? '0'))
    .slice(0, 15)

  const senderName = (s: string) => s?.includes('<') ? s.split('<')[0].trim() : s?.slice(0, 20)

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow text-center">
          <p className="text-red-500 font-semibold mb-2">데이터 로드 실패</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f0f2f5' }}>
      {/* Header */}
      <header style={{ background: '#1a1a2e', color: 'white', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 600 }}>📬 이메일 티켓 대시보드</h1>
        <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>총 {total}건</span>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>

        {/* KPI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: '조치 필요', value: 조치필요, color: '#e74c3c' },
            { label: '신규 대기', value: 신규대기, color: '#e67e22' },
            { label: '지연', value: 지연건수, color: '#2980b9' },
            { label: '검토 필요', value: 검토필요, color: '#8e44ad' },
            { label: '회신 완료', value: 회신완료, color: '#27ae60' },
          ].map(k => (
            <div key={k.label} style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
              <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: 8 }}>{k.label}</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 18 }}>📂 분류별 현황</h2>
            {Object.entries(분류Map).sort((a,b)=>b[1]-a[1]).map(([k,v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ width: 130, fontSize: '0.82rem', color: '#555', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k}</span>
                <div style={{ flex: 1, background: '#f0f2f5', borderRadius: 4, height: 10 }}>
                  <div style={{ width: `${Math.round(v/total*100)}%`, background: '#3498db', borderRadius: 4, height: 10 }} />
                </div>
                <span style={{ fontSize: '0.82rem', color: '#888', width: 30, textAlign: 'right' }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 18 }}>🏢 담당부서별 현황</h2>
            {Object.entries(부서Map).filter(([k])=>k!=='자동분류(처리불요)').sort((a,b)=>b[1]-a[1]).map(([k,v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ width: 130, fontSize: '0.82rem', color: '#555', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k}</span>
                <div style={{ flex: 1, background: '#f0f2f5', borderRadius: 4, height: 10 }}>
                  <div style={{ width: `${Math.round(v/total*100)}%`, background: '#3498db', borderRadius: 4, height: 10 }} />
                </div>
                <span style={{ fontSize: '0.82rem', color: '#888', width: 30, textAlign: 'right' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 18 }}>😊 감정 분석</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {[
                { key: '긍정', bg: '#eafaf1', color: '#27ae60' },
                { key: '중립', bg: '#f0f3fa', color: '#5d6d7e' },
                { key: '부정', bg: '#fdecea', color: '#c0392b' },
              ].map(({ key, bg, color }) => (
                <div key={key} style={{ textAlign: 'center', padding: 16, borderRadius: 8, background: bg }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color }}>{감정Map[key] ?? 0}</div>
                  <div style={{ fontSize: '0.8rem', marginTop: 4, color }}>{key}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 18 }}>📊 처리 현황</h2>
            {Object.entries(처리Map).sort((a,b)=>b[1]-a[1]).map(([k,v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ width: 130, fontSize: '0.82rem', color: '#555', flexShrink: 0 }}>{k}</span>
                <div style={{ flex: 1, background: '#f0f2f5', borderRadius: 4, height: 10 }}>
                  <div style={{ width: `${Math.round(v/total*100)}%`, background: '#3498db', borderRadius: 4, height: 10 }} />
                </div>
                <span style={{ fontSize: '0.82rem', color: '#888', width: 30, textAlign: 'right' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Urgent Table */}
        <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 18 }}>🚨 처리 필요 티켓 (경과일 순)</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                {['티켓 ID', '경과', '발신자', '분류', '상태'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#555', borderBottom: '2px solid #e9ecef' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {urgent.map((r, i) => {
                const status = r[처리상태Idx] ?? ''
                const delay = r[지연Idx] ?? ''
                const link = r[linkIdx] ?? '#'
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f2f5' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <a href={link} target="_blank" rel="noreferrer" style={{ color: '#3498db', textDecoration: 'none', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {(r[tidIdx] ?? '').slice(0, 12)}
                      </a>
                    </td>
                    <td style={{ padding: '10px 12px' }}>{r[경과Idx]}일</td>
                    <td style={{ padding: '10px 12px' }}>{senderName(r[발신자Idx] ?? '')}</td>
                    <td style={{ padding: '10px 12px' }}>{r[분류Idx]}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                        background: status === '조치필요' ? '#fdecea' : '#fef9e7',
                        color: status === '조치필요' ? '#c0392b' : '#d68910',
                      }}>{status}</span>
                      {delay === '지연' && <span style={{ marginLeft: 4, display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: '#fdedec', color: '#e74c3c' }}>지연</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
