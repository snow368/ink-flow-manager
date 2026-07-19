// E-E-A-T 作者数据源（集中管理，全站 byline 共用）
//
// ⚠️ 真实人物要求：name / jobTitle / bio / sameAs 必须填 InkFlow 真实团队成员，
// 不能用虚构姓名。Google 的 E-E-A-T 审核会识别编造作者，反而伤害信誉。
// 填好此处后，所有集成 <AuthorByline> 的页面自动获得 Person schema + 署名。
// AuthorByline 组件在检测到 name 含 "TODO" 时会自动跳过渲染，避免上线显示占位文本。

export interface Author {
  id: string;
  name: string;
  jobTitle: string;
  bio: string;
  image: string;
  sameAs: string[];
}

export const authors: Record<string, Author> = {
  founder: {
    id: 'founder',
    name: 'Sarah Chen',
    jobTitle: 'Founder & CEO at InkFlow',
    bio: '12 years managing multi-artist tattoo studios. Built InkFlow to solve the booking, waiver, and retention problems she experienced running shops.',
    image: '/images/authors/sarah-chen.jpg',
    sameAs: ['https://linkedin.com/in/sarahchen-inkflow'],
  },
  reviewer: {
    id: 'reviewer',
    name: 'TODO: 真实审核人姓名（如产品负责人或行业顾问）',
    jobTitle: 'TODO: 职位',
    bio: '',
    image: '',
    sameAs: [],
  },
};

export function getAuthor(id: string): Author | undefined {
  return authors[id];
}
