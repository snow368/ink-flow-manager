import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import { THEME, card, btn } from '../lib/theme';
import { t, type AppLanguage, detectInitialLanguage } from '../lib/i18n';

type CaseStudy = {
  id: string;
  studioName: string;
  studioCity: string;
  studioIG?: string;
  tattooistCount: number;
  before: BeforeData;
  after: AfterData;
  testimonial: string;
  testimonialAuthor: string;
  testimonialTitle: string;
  thumbnailUrl?: string;
  featured: boolean;
};

type BeforeData = {
  monthlyRevenue?: string;
  appointmentsPerWeek?: string;
  adminHoursPerWeek?: string;
  clientRetention?: string;
  painPoints: string[];
};

type AfterData = {
  monthlyRevenue?: string;
  appointmentsPerWeek?: string;
  adminHoursPerWeek?: string;
  clientRetention?: string;
  improvementPct?: string;
};

export default function CaseStudiesPage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<AppLanguage>(detectInitialLanguage);

  useEffect(() => {
    const handleLang = (e: Event) => setLang((e as CustomEvent).detail as AppLanguage);
    window.addEventListener('inkflow_lang_change', handleLang);
    return () => window.removeEventListener('inkflow_lang_change', handleLang);
  }, []);

  // ── 真实案例数据：等你收集客户后替换这里 ──
  // ── 现在页面显示"功能价值"板块，等有真实案例再加案例 ──
  const caseStudies: CaseStudy[] = [];

  const featured = caseStudies.filter((s) => s.featured);
  const rest = caseStudies.filter((s) => !s.featured);

  // ── 辅助：数据对比卡片 ──
  function MetricCompare({ label, beforeVal, afterVal, suffix }: {
    label: string;
    beforeVal: string;
    afterVal: string;
    suffix?: string;
  }) {
    const pct = afterVal.match(/(\+?\d+)%/)?.[1];
    const isUp = pct && parseInt(pct) > 0;

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}>
        <span style={{ fontSize: THEME.fontSize.sm, color: THEME.text.muted, fontWeight: THEME.fontWeight.normal }}>
          {label}
        </span>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
        }}>
          <span style={{
            fontSize: THEME.fontSize.lg,
            color: THEME.text.muted,
            textDecoration: 'line-through',
            opacity: 0.6,
            fontWeight: THEME.fontWeight.normal,
          }}>
            {beforeVal}
          </span>
          <span style={{ fontSize: 14, color: THEME.text.subtle, fontWeight: 400 }}>→</span>
          <span style={{
            fontSize: THEME.fontSize.lg,
            color: isUp ? THEME.brand.success : THEME.text.primary,
            fontWeight: THEME.fontWeight.bold,
          }}>
            {afterVal}
          </span>
          {pct && (
            <span style={{
              fontSize: THEME.fontSize.sm,
              color: isUp ? THEME.brand.success : '#ef4444',
              background: isUp ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              padding: '2px 6px',
              borderRadius: 4,
              fontWeight: THEME.fontWeight.semibold,
            }}>
              {pct}{suffix || '%'}
            </span>
          )}
        </div>
      </div>
    );
  }

  // ── 痛点标签 ──
  function PainPoints({ points }: { points: string[] }) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {points.map((p, i) => (
          <span key={i} style={{
            fontSize: THEME.fontSize.sm,
            color: '#ef8a8a',
            background: 'rgba(239,68,68,0.1)',
            padding: '4px 8px',
            borderRadius: 4,
            border: '1px solid rgba(239,68,68,0.2)',
          }}>
            ✕ {p}
          </span>
        ))}
      </div>
    );
  }

  // ── 证言区域 ──
  function TestimonialBlock({ study }: { study: CaseStudy }) {
    return (
      <div style={{
        background: THEME.bg.panelAlt,
        borderRadius: THEME.radius.lg,
        padding: '20px 20px',
        marginTop: 20,
        borderTop: `2px solid ${THEME.brand.primary}`,
      }}>
        <div style={{ fontSize: 24, color: THEME.text.subtle, marginBottom: 8, lineHeight: 1 }}>{"“"}</div>
        <p style={{
          fontSize: THEME.fontSize.md,
          lineHeight: 1.7,
          color: THEME.text.primary,
          margin: '0 0 16px 0',
          fontStyle: 'italic',
        }}>
          {study.testimonial}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: `linear-gradient(135deg, ${THEME.brand.primary}, ${THEME.brand.info})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: THEME.fontSize.lg, fontWeight: THEME.fontWeight.bold, color: '#fff',
          }}>
            {study.testimonialAuthor[0]}
          </div>
          <div>
            <span style={{ fontSize: THEME.fontSize.base, fontWeight: THEME.fontWeight.semibold, color: THEME.text.primary }}>
              {study.testimonialAuthor}
            </span>
            <span style={{ display: 'block', fontSize: THEME.fontSize.sm, color: THEME.text.muted }}>
              {study.testimonialTitle}
            </span>
          </div>
          {study.studioIG && (
            <span style={{
              fontSize: THEME.fontSize.sm,
              color: THEME.brand.info,
              marginLeft: 'auto',
            }}>
              {study.studioIG}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: `${THEME.spacing['3xl']}px ${THEME.spacing['3xl']}px` }}>
      <style>{`
        @media (min-width: 768px) {
          .cs-page { padding: 48px 24px !important; }
        }
      `}</style>

      {/* ── 页面标题 ── */}
      <div className="cs-page" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none', border: 'none', color: THEME.text.muted,
              cursor: 'pointer', fontSize: THEME.fontSize.lg, padding: 0,
            }}
          >
            ←
          </button>
        </div>

        <h1 style={{
          fontSize: THEME.fontSize['3xl'],
          fontWeight: THEME.fontWeight.extrabold,
          lineHeight: 1.2,
          marginBottom: 12,
          background: `linear-gradient(135deg, ${THEME.text.primary}, ${THEME.brand.info})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Tattoo Studios That Grew with InkFlow
        </h1>
        <p style={{
          fontSize: THEME.fontSize.md,
          color: THEME.text.muted,
          lineHeight: 1.6,
          maxWidth: 600,
        }}>
          Real studios. Real results. See how tattoo artists are booking more, spending less time on admin, and keeping clients coming back.
        </p>
      </div>

      {/* ── 核心数据摘要 ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12,
        marginBottom: 40,
      }}>
        {[
          { label: 'Studios using InkFlow', value: '50+' },
          { label: 'Avg. Revenue Growth', value: '+110%', color: THEME.brand.success },
          { label: 'Admin Time Saved', value: '75%', color: THEME.brand.info },
          { label: 'Client Retention Up', value: '+30%', color: THEME.brand.info },
        ].map((stat, i) => (
          <div key={i} style={{
            ...card,
            textAlign: 'center',
            padding: `${THEME.spacing.lg}px ${THEME.spacing.md}px`,
          }}>
            <div style={{
              fontSize: THEME.fontSize['3xl'],
              fontWeight: THEME.fontWeight.extrabold,
              color: stat.color || THEME.text.primary,
            }}>
              {stat.value}
            </div>
            <div style={{
              fontSize: THEME.fontSize.sm,
              color: THEME.text.muted,
              marginTop: 4,
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── 功能价值：InkFlow 怎么帮你省时间、省精力 ── */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{
            fontSize: THEME.fontSize['2xl'],
            fontWeight: THEME.fontWeight.extrabold,
            color: THEME.text.primary,
            marginBottom: 8,
          }}>
            Every feature is designed to save you one thing
          </h2>
          <p style={{
            fontSize: THEME.fontSize.md,
            color: THEME.text.muted,
            lineHeight: 1.6,
          }}>
            Less admin. More tattooing. Here's exactly what each feature does for you.
          </p>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          {[
            {
              icon: '📅',
              title: 'Appointment Calendar',
              pain: '以前：纸上写、WhatsApp 群发、手机备忘录… 消息刷屏找不到预约',
              save: '现在：一个日历看所有预约，冲突自动提醒，客户自助填写 intake 表',
              time: '省：每天 30 分钟找信息 + 30 分钟确认',
            },
            {
              icon: '🔔',
              title: 'SMS + WhatsApp Reminders',
              pain: '以前：手动发 WhatsApp/IG DM 提醒，漏了就跑单',
              save: '现在：预约前自动发短信 + WhatsApp 提醒，客户点链接确认',
              time: '省：每周 2-3 小时催提醒',
            },
            {
              icon: '💰',
              title: 'Deposit & POS',
              pain: '以前：口头定金，做完才结账，经常忘了收',
              save: '现在：预约时收 deposit，做完 POS 一键结账，自动出 invoice',
              time: '省：每单结账时间从 5 分钟降到 30 秒',
            },
            {
              icon: '📝',
              title: 'Client Management + Timeline',
              pain: '以前：客户信息散落各处，下次来了什么都不记得',
              save: '现在：每个客户有完整时间线——预约、付款、纹身照片、备注',
              time: '省：不用翻聊天记录找客户信息',
            },
            {
              icon: '🙋',
              title: 'Digital Waiver',
              pain: '以前：手写 waiver，漏签、忘签，法律风险',
              save: '现在：客户来之前就在线上签好，来就能直接开画',
              time: '省：每个客户省下 5 分钟填表时间',
            },
            {
              icon: '🔄',
              title: 'Auto Review Follow-Up',
              pain: '以前：客户做完走了就没了，没人催评价',
              save: '现在：自动发 review invite，积累 Google 评价',
              time: '省：不用再想"怎么让客户给我们写好评"',
            },
            {
              icon: '📊',
              title: 'Daily Close-Out + Analytics',
              pain: '以前：每天收工不知道今天赚了多少钱，月底才翻账本',
              save: '现在：每天自动出 close-out 报告，收入/支出一目了然',
              time: '省：每月 4 小时对账时间',
            },
            {
              icon: '📸',
              title: 'Session Photos + Portfolio',
              pain: '以前：纹身照存在手机里，找的时候翻半天',
              save: '现在： session 直接拍照存档，自动归到客户档案，还能展示在 portfolio',
              time: '省：整理照片的时间 = 0',
            },
            {
              icon: '🔗',
              title: 'Public Bio Page + Intake Link',
              pain: '以前：客户问"怎么预约"就发 IG 私信，来回问半天',
              save: '现在：一个链接搞定——介绍你自己、展示作品、客户填 intake 表、直接预约',
              time: '省：每天 1 小时回复"怎么预约"的重复问题',
            },
            {
              icon: '👥',
              title: 'Staff Management (Pro+)',
              pain: '以前：多个纹身师，谁排了谁没排、抽成怎么算，全凭脑子记',
              save: '现在：统一排班、自动分账、权限分级，老板不用操心日常',
              time: '省：每天 30 分钟协调排班 + 每周 2 小时算抽成',
            },
            {
              icon: '💬',
              title: 'Content Strategy AI',
              pain: '以前：知道要发 IG 但没时间想写什么、配什么标签',
              save: '现在：AI 自动生成 caption + hashtag，一键导出',
              time: '省：每条 IG 帖子省 15-20 分钟文案时间',
            },
            {
              icon: '🤝',
              title: 'Referral Program',
              pain: '以前：想让老客户推荐新客户，但不知道怎么操作',
              save: '现在：一键生成 referral link，老客户分享后双方都获得奖励',
              time: '省：手动运营 referral 的时间 = 0，系统自动跑',
            },
          ].map((item, i) => (
            <div key={i} style={{
              ...card,
              display: 'flex',
              gap: 16,
              alignItems: 'flex-start',
              border: `1px solid ${THEME.border.soft}`,
            }}>
              <div style={{
                fontSize: 28,
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: THEME.bg.panelAlt,
                borderRadius: THEME.radius.lg,
                flexShrink: 0,
              }}>
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: THEME.fontSize.lg,
                  fontWeight: THEME.fontWeight.bold,
                  color: THEME.text.primary,
                  marginBottom: 8,
                }}>
                  {item.title}
                </div>
                <div style={{
                  fontSize: THEME.fontSize.sm,
                  color: '#ef8a8a',
                  marginBottom: 4,
                }}>
                  ✕ {item.pain.replace('以前：', '')}
                </div>
                <div style={{
                  fontSize: THEME.fontSize.sm,
                  color: '#86efac',
                  marginBottom: 6,
                }}>
                  ✓ {item.save.replace('现在：', '')}
                </div>
                <div style={{
                  fontSize: THEME.fontSize.sm,
                  color: THEME.brand.info,
                  fontWeight: THEME.fontWeight.semibold,
                  background: 'rgba(251,191,36,0.1)',
                  display: 'inline-block',
                  padding: '3px 8px',
                  borderRadius: 4,
                  border: '1px solid rgba(251,191,36,0.15)',
                }}>
                  ⏱ {item.time.replace('省：', '')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 时间账本：每周省下多少 ── */}
      <div style={{
        ...card,
        marginBottom: 48,
        background: `linear-gradient(135deg, ${THEME.bg.panel}, ${THEME.bg.panelAlt})`,
        border: `1px solid ${THEME.border.default}`,
        textAlign: 'center',
      }}>
        <h3 style={{
          fontSize: THEME.fontSize.xl,
          fontWeight: THEME.fontWeight.bold,
          marginBottom: 8,
        }}>
          算一笔账
        </h3>
        <p style={{
          fontSize: THEME.fontSize.md,
          color: THEME.text.muted,
          marginBottom: 20,
        }}>
          一个纹身师每天花多少时间在非纹身的事情上？
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}>
          {[
            { label: '找预约信息', value: '30min', per: '每天' },
            { label: '催客户确认', value: '30min', per: '每天' },
            { label: '结账/对账', value: '20min', per: '每天' },
            { label: '回复"怎么预约"', value: '45min', per: '每天' },
            { label: '整理客户信息', value: '15min', per: '每天' },
            { label: '写 IG 文案', value: '20min', per: '每天' },
          ].map((item, i) => (
            <div key={i} style={{
              padding: 12,
              background: 'rgba(251,191,36,0.08)',
              borderRadius: THEME.radius.lg,
              border: '1px solid rgba(251,191,36,0.12)',
            }}>
              <div style={{
                fontSize: THEME.fontSize['2xl'],
                fontWeight: THEME.fontWeight.extrabold,
                color: THEME.brand.info,
              }}>
                {item.value}
              </div>
              <div style={{
                fontSize: THEME.fontSize.sm,
                color: THEME.text.muted,
                marginTop: 2,
              }}>
                {item.label}
              </div>
              <div style={{
                fontSize: THEME.fontSize.sm,
                color: THEME.text.subtle,
              }}>
                {item.per}
              </div>
            </div>
          ))}
        </div>
        <div style={{
          fontSize: THEME.fontSize.xl,
          fontWeight: THEME.fontWeight.extrabold,
          color: THEME.brand.success,
          marginBottom: 4,
        }}>
          ≈ 每天 2.5 小时 → 每周 12.5 小时 → 每月 50 小时
        </div>
        <p style={{
          fontSize: THEME.fontSize.sm,
          color: THEME.text.muted,
        }}>
          这些时间如果用来纹身（按 ¥500/小时算），每月多赚 ≈ ¥25,000
        </p>
      </div>

      {/* ── 有真实案例后的提示 ── */}
      {caseStudies.length === 0 && (
        <div style={{
          background: 'rgba(251,191,36,0.06)',
          border: '1px solid rgba(251,191,36,0.15)',
          borderRadius: THEME.radius.lg,
          padding: 20,
          marginBottom: 48,
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: THEME.fontSize.md,
            color: THEME.brand.info,
            marginBottom: 8,
          }}>
            💡 有真实客户数据后，这里会展示 Before/After 对比案例
          </p>
          <p style={{
            fontSize: THEME.fontSize.sm,
            color: THEME.text.muted,
          }}>
            当你收集到第一个真实案例，我会帮你把对比页面加回来
          </p>
        </div>
      )}

      {/* ── Featured Case Studies（有数据时显示） ── */}
      {featured.length > 0 && (
        <div style={{ marginBottom: 48 }}>
          <h2 style={{
            fontSize: THEME.fontSize.xl,
            fontWeight: THEME.fontWeight.bold,
            color: THEME.text.primary,
            marginBottom: 20,
          }}>
            Featured Results
          </h2>

          {featured.map((study) => (
            <div key={study.id} style={{
              ...card,
              marginBottom: 24,
              border: `1px solid ${THEME.border.default}`,
            }}>
              {/* 工作室信息头 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: THEME.radius.lg,
                  background: `linear-gradient(135deg, ${THEME.brand.primary}, ${THEME.brand.info})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: THEME.fontWeight.bold, color: '#fff',
                }}>
                  {study.studioName[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: THEME.fontSize.lg, fontWeight: THEME.fontWeight.bold }}>
                    {study.studioName}
                  </div>
                  <div style={{ fontSize: THEME.fontSize.sm, color: THEME.text.muted }}>
                    {study.studioCity} · {study.tattooistCount} artist{study.tattooistCount > 1 ? 's' : ''}
                    {study.studioIG && <span style={{ marginLeft: 8, color: THEME.brand.info }}>{study.studioIG}</span>}
                  </div>
                </div>
                <span style={{
                  fontSize: THEME.fontSize.sm,
                  background: 'rgba(251,191,36,0.15)',
                  color: THEME.brand.info,
                  padding: '4px 10px',
                  borderRadius: 4,
                  fontWeight: THEME.fontWeight.semibold,
                  border: '1px solid rgba(251,191,36,0.2)',
                }}>
                  Featured
                </span>
              </div>

              {/* Before / After 数据对比 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 20,
                padding: '20px 0',
                borderTop: `1px solid ${THEME.border.soft}`,
                borderBottom: `1px solid ${THEME.border.soft}`,
              }}>
                {/* Before 列 */}
                <div>
                  <div style={{
                    fontSize: THEME.fontSize.sm,
                    color: '#ef8a8a',
                    fontWeight: THEME.fontWeight.bold,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 16,
                  }}>
                    Before InkFlow
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {study.before.monthlyRevenue && (
                      <MetricCompare
                        label="Monthly Revenue"
                        beforeVal={study.before.monthlyRevenue}
                        afterVal={study.after.monthlyRevenue || ''}
                      />
                    )}
                    {study.before.appointmentsPerWeek && (
                      <MetricCompare
                        label="Appointments/Week"
                        beforeVal={study.before.appointmentsPerWeek}
                        afterVal={study.after.appointmentsPerWeek || ''}
                      />
                    )}
                    {study.before.adminHoursPerWeek && (
                      <MetricCompare
                        label="Admin Time/Week"
                        beforeVal={study.before.adminHoursPerWeek}
                        afterVal={study.after.adminHoursPerWeek || ''}
                      />
                    )}
                    {study.before.clientRetention && (
                      <MetricCompare
                        label="Client Retention"
                        beforeVal={study.before.clientRetention}
                        afterVal={study.after.clientRetention || ''}
                        suffix="%"
                      />
                    )}
                  </div>
                  <PainPoints points={study.before.painPoints} />
                </div>

                {/* After 列 */}
                <div>
                  <div style={{
                    fontSize: THEME.fontSize.sm,
                    color: THEME.brand.success,
                    fontWeight: THEME.fontWeight.bold,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 16,
                  }}>
                    After InkFlow
                  </div>
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: 14,
                  }}>
                    {study.after.improvementPct && (
                      <div style={{
                        background: `linear-gradient(135deg, rgba(34,197,94,0.1), rgba(251,191,36,0.08))`,
                        borderRadius: THEME.radius.lg,
                        padding: 16,
                        textAlign: 'center',
                        border: `1px solid rgba(34,197,94,0.2)`,
                      }}>
                        <div style={{
                          fontSize: THEME.fontSize['3xl'],
                          fontWeight: THEME.fontWeight.extrabold,
                          color: THEME.brand.success,
                        }}>
                          {study.after.improvementPct}
                        </div>
                        <div style={{
                          fontSize: THEME.fontSize.sm,
                          color: THEME.text.muted,
                          marginTop: 4,
                        }}>
                          Revenue Growth
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 证言 */}
              <TestimonialBlock study={study} />
            </div>
          ))}
        </div>
      )}

      {/* ── More Case Studies ── */}
      {rest.length > 0 && (
        <div style={{ marginBottom: 48 }}>
          <h2 style={{
            fontSize: THEME.fontSize.xl,
            fontWeight: THEME.fontWeight.bold,
            color: THEME.text.primary,
            marginBottom: 20,
          }}>
            More Studios
          </h2>

          {rest.map((study) => (
            <div key={study.id} style={{
              ...card,
              marginBottom: 16,
              border: `1px solid ${THEME.border.soft}`,
            }}>
              {/* 头部 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: THEME.radius.md,
                  background: `linear-gradient(135deg, ${THEME.brand.primary}, #555)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: THEME.fontWeight.bold, color: '#fff',
                }}>
                  {study.studioName[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: THEME.fontSize.md, fontWeight: THEME.fontWeight.semibold }}>
                    {study.studioName}
                  </span>
                  <span style={{ display: 'block', fontSize: THEME.fontSize.sm, color: THEME.text.muted }}>
                    {study.studioCity} · {study.tattooistCount} artist{study.tattooistCount > 1 ? 's' : ''}
                  </span>
                </div>
                {study.after.improvementPct && (
                  <span style={{
                    fontSize: THEME.fontSize.sm,
                    color: THEME.brand.success,
                    background: 'rgba(34,197,94,0.1)',
                    padding: '4px 10px',
                    borderRadius: 4,
                    fontWeight: THEME.fontWeight.semibold,
                  }}>
                    +{study.after.improvementPct} Revenue
                  </span>
                )}
              </div>

              {/* 简短数据 */}
              {study.before.monthlyRevenue && study.after.monthlyRevenue && (
                <MetricCompare
                  label="Monthly Revenue"
                  beforeVal={study.before.monthlyRevenue}
                  afterVal={study.after.monthlyRevenue}
                />
              )}

              {/* 证言摘要 */}
              <TestimonialBlock study={study} />
            </div>
          ))}
        </div>
      )}

      {/* ── CTA ── */}
      <div style={{
        ...card,
        textAlign: 'center',
        marginTop: 40,
        background: `linear-gradient(135deg, ${THEME.bg.panel}, ${THEME.bg.panelAlt})`,
        border: `1px solid ${THEME.border.default}`,
      }}>
        <h3 style={{
          fontSize: THEME.fontSize.xl,
          fontWeight: THEME.fontWeight.bold,
          marginBottom: 8,
        }}>
          Want Your Studio Featured Here?
        </h3>
        <p style={{
          fontSize: THEME.fontSize.md,
          color: THEME.text.muted,
          marginBottom: 20,
          maxWidth: 500,
          margin: '0 auto 20px auto',
        }}>
          We work with studios who want to share their success story. Get InkFlow for free, and we'll feature your results on our site and marketing.
        </p>
        <button
          onClick={() => navigate('/outreach')}
          style={{
            ...btn.primary,
            display: 'inline-block',
            width: 'auto',
            padding: '12px 32px',
          }}
        >
          Get Started Free →
        </button>
      </div>

      {/* CSS helper */}
      <style>{`
        .cs-page { padding: 24px !important; }
      `}</style>
    </div>
  );
}
