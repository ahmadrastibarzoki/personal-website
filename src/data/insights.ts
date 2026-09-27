export type Insight = {
  slug: string;
  title: string;
  description: string;
  category: string;
  datePublished: string;
  dateModified: string;
  readingTime: string;
  keywords: string[];
  image: string;
  imageAlt: string;
};

export const insights: Insight[] = [
  {
    slug: 'graph-anomaly-detection-autoencoders',
    title: 'Graph Anomaly Detection with Graph Autoencoders: A Practical Research Guide',
    description: 'A practical guide to graph anomaly detection with graph autoencoders, attention-based encoders, anomaly scoring, evaluation pitfalls and structure-aware regularization.',
    category: 'Graph Machine Learning',
    datePublished: '2026-09-27',
    dateModified: '2026-09-27',
    readingTime: '8 min read',
    keywords: [
      'graph anomaly detection',
      'graph autoencoder',
      'graph neural networks',
      'GAT',
      'unsupervised anomaly detection',
      'representation learning'
    ],
    image: '/images/project-graph-anomaly.png',
    imageAlt: 'Graph anomaly detection with graph neural networks'
  },
  {
    slug: 'retail-analytics-engineering',
    title: 'Designing Reliable Retail Analytics Pipelines: From Raw Transactions to Decision-Ready Data',
    description: 'A practical blueprint for retail analytics engineering: validation, dimensional modeling, incremental processing, testing and trustworthy business metrics.',
    category: 'Analytics Engineering',
    datePublished: '2026-09-27',
    dateModified: '2026-09-27',
    readingTime: '7 min read',
    keywords: [
      'retail analytics',
      'analytics engineering',
      'data pipeline',
      'dimensional modeling',
      'data quality',
      'incremental loading'
    ],
    image: '/images/project-retail-analytics.png',
    imageAlt: 'Retail analytics engineering pipeline'
  },
  {
    slug: 'responsible-generative-ai-higher-education',
    title: 'Responsible Generative AI in Higher Education: From Policy to Course Design',
    description: 'A practical framework for moving responsible generative AI from policy statements into course design, assessment, academic integrity and continuous evaluation.',
    category: 'Responsible AI',
    datePublished: '2026-09-27',
    dateModified: '2026-09-27',
    readingTime: '8 min read',
    keywords: [
      'responsible generative AI',
      'AI in education',
      'higher education',
      'academic integrity',
      'assessment design',
      'generative AI policy'
    ],
    image: '/images/publication-egenai-dbr.png',
    imageAlt: 'Responsible generative AI integration in higher education'
  }
];

export function getInsight(slug: string): Insight {
  const insight = insights.find((item) => item.slug === slug);
  if (!insight) throw new Error(`Insight not found: ${slug}`);
  return insight;
}
