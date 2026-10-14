---
title: "Graph Anomaly Detection: Evaluation Pitfalls in Unsupervised Settings"
description: "A practical research guide to reliable unsupervised graph anomaly detection evaluation: label leakage, transductive splits, imbalanced metrics, contamination and fair baselines."
summary: "An impressive anomaly-detection score is not enough. The evaluation protocol must make information access, anomaly labels, preprocessing, comparisons and operational ranking explicit—especially when the data is a graph."
category: "Graph Machine Learning"
datePublished: 2026-10-14
dateModified: 2026-10-14
keywords:
  - "graph anomaly detection"
  - "unsupervised learning"
  - "graph neural networks"
  - "data leakage"
  - "PR-AUC"
  - "evaluation protocol"
  - "transductive learning"
  - "representation learning"
image: "/images/graph-anomaly-evaluation-2026-10-14.jpg"
imageAlt: "Dark navy illustration of a graph network with highlighted anomalous nodes and evaluation plots"
draft: false
sources:
  - title: "Ma et al. — A Comprehensive Survey on Graph Anomaly Detection with Deep Learning"
    url: "https://arxiv.org/abs/2106.07178"
  - title: "Saito and Rehmsmeier (2015) — Precision-recall versus ROC under class imbalance"
    url: "https://doi.org/10.1371/journal.pone.0118432"
  - title: "scikit-learn — Common pitfalls and data leakage"
    url: "https://scikit-learn.org/stable/common_pitfalls.html"
  - title: "scikit-learn — Average precision score"
    url: "https://scikit-learn.org/stable/modules/generated/sklearn.metrics.average_precision_score.html"
---

A graph anomaly detector might identify a strange connection, an unexpected group of neighbors, or a node whose attributes do not fit its structural role. None of these observations is automatically evidence of fraud, malfunction, or a mistake. **Anomaly** means a deviation from some reference behavior; deciding what that deviation means requires context.

In my work on graph representation learning and unsupervised anomaly detection, I have found that model architecture attracts attention quickly. The evaluation protocol often deserves at least as much scrutiny.

This article focuses on a practical question: **How do we know that an apparent improvement in graph anomaly detection is real?**

## First, define what is being detected

"Graph anomaly detection" covers several different tasks:

- **Node anomalies:** an individual node behaves unusually relative to its features, neighbors or structural role.
- **Edge anomalies:** a relationship is unlikely given the participating nodes and the rest of the graph.
- **Subgraph anomalies:** a group of otherwise unremarkable nodes forms an unusual structure.
- **Graph-level anomalies:** an entire graph deviates from a collection of normal graphs.

These tasks require different scoring units and labels. A node-level ROC-AUC score cannot be compared directly with a graph-level result as though they measured the same problem.

The evaluation should specify the *unit of detection*, which anomalies matter, how ground truth was obtained, and whether the system must rank candidates or make a fixed alert decision.

## Pitfall 1 — Leakage hidden in the workflow

A common error is to use information that would not be available under the claimed evaluation setting.

In ordinary machine learning, a familiar example is fitting a scaler or selecting features on the complete dataset before creating a train/test split. A similarly serious error in unsupervised anomaly detection is tuning hyperparameters, combining anomaly scores, or selecting a decision threshold using labels from the final test set.

For graphs, the boundary is more subtle.

### Transductive and inductive are not interchangeable

In a **transductive** protocol, a method may legitimately use the full *unlabeled* graph structure—including connections involving nodes later evaluated—if that is what the benchmark explicitly permits. Seeing a test node's existence is not necessarily label leakage.

In an **inductive** or prospective deployment scenario, the model must work on nodes, edges, or time periods that were not available during fitting. Learning from their future features or edges would violate that setting.

Neither protocol is universally superior. Problems arise when a paper reports one setting but effectively evaluates the other—or when two methods use different amounts of permitted information.

A robust protocol documents:

1. What graph, node attributes, edges and timestamps are visible at each stage.
2. Which anomaly labels are withheld until the final evaluation.
3. How preprocessing, feature selection and score normalization are fitted.
4. Whether validation labels are used, and if so, whether the method should still be described as purely unsupervised.

**Practical check:** draw the information boundary before training the first model. If a pipeline step cannot be placed clearly on one side, investigate it.

## Pitfall 2 — Comparing models under different conditions

A sophisticated graph neural network can appear better than a simple baseline if it receives more favorable data, a different split, extra features or a larger tuning budget.

For a useful comparison, keep the following aligned wherever the methods allow it:

- The same task definition, samples and train/validation/test boundaries.
- Identical permitted feature and graph access.
- A stated, reasonably comparable approach to hyperparameter selection.
- The same positive-label convention, score direction and evaluation implementation.
- Repeated runs and variability reporting when stochastic training or sampling is involved.

Include **non-graph baselines**. A feature-only anomaly detector helps answer whether the graph relationships add information beyond the attributes. A simple graph-aware heuristic can help establish whether a complex encoder is justified.

If a model performs well only when a particular dataset split or injected-anomaly design is used, that limitation belongs in the result—not hidden in a footnote.

## Pitfall 3 — Reporting a metric without its context

Anomalies are often rare. Suppose just 1% of observations are labeled anomalous. A system that predicts every observation to be normal obtains **99% accuracy**, yet catches none of the anomalies.

That makes accuracy alone a poor primary metric for most anomaly-ranking experiments.

### ROC-AUC, average precision and PR curves answer different questions

- **ROC-AUC** describes discrimination over false-positive and true-positive rates across thresholds. It remains useful, but can look reassuring when negatives vastly outnumber positives.
- **Precision–recall analysis** focuses on how many flagged candidates are genuinely anomalous and how many known anomalies are recovered. Its interpretation is sensitive to prevalence.
- **Average precision (AP)** summarizes the precision–recall curve with a particular stepwise weighting. Be explicit: scikit-learn AP is **not identical** to trapezoidal area under a PR curve.
- **Precision@K / Recall@K** can be more actionable when reviewers can inspect only a fixed number of suspicious nodes each day.

The appropriate metric depends on the workflow. A research benchmark focused on ranking is not the same as an operational alerting system with a limited investigation budget.

Always report the positive-class fraction and the scoring convention. If a high anomaly score means "more anomalous" for one method and "more normal" for another, normalize the direction before computing metrics.

For a useful discussion of class imbalance, see [Saito and Rehmsmeier's analysis of PR versus ROC plots](https://doi.org/10.1371/journal.pone.0118432).

## Pitfall 4 — Ignoring contamination and benchmark construction

Unsupervised does not necessarily mean "trained only on normal data." Many methods train on unlabeled graphs that already contain anomalous nodes or edges.

That is not automatically invalid, but it changes the learning problem. An autoencoder may reconstruct some anomalies well; message passing may spread information from anomalous neighbors; a clustering method may treat a frequent abnormal pattern as part of the reference distribution.

A credible evaluation should explain:

- Whether anomalies were present in training and at approximately what prevalence.
- Whether anomalous examples were real, curated, or artificially injected.
- How synthetic anomalies were constructed and whether they are too easy to identify.
- Whether graph size, density, homophily or anomaly prevalence change the results.
- How sensitive the method is to different random seeds and data splits.

Synthetic benchmarks can test controlled mechanisms, but they should not be mistaken for evidence of general effectiveness on every real-world graph.

## Pitfall 5 — Mistaking unusual for harmful

Imagine a social network where a researcher collaborates across several otherwise separate communities. The pattern may be structurally rare. That does not make it malicious.

An anomaly score is evidence of **unexpectedness under the model's assumptions**, not a verdict.

That distinction matters for human review, explainability and responsible deployment. If a system flags a node, investigators need to know whether the result came from unusual attributes, unusual edges, a mismatch between the two, or a shifting community structure.

Consider showing the contributing signals separately before collapsing them into one score. Otherwise, a technically strong model can produce a poor decision-support tool.

## A reproducible evaluation protocol

For a practical research project, I prefer a small evaluation record that another person can inspect:

| Question | What to record |
| --- | --- |
| What is anomalous? | Node, edge, subgraph or entire graph; positive-label definition |
| What can the model see? | Transductive/inductive setting, allowed structure, features and time horizon |
| Where are labels used? | Training, model selection, calibration and final testing |
| What changes across methods? | Architecture and scoring, rather than unreported data privileges |
| How are results measured? | ROC-AUC, AP or PR-AUC, Precision@K, prevalence and score direction |
| How reliable is the comparison? | Multiple runs, seeds, variation and relevant baselines |
| What would change the conclusion? | Contamination level, graph properties, split and alert budget |

This is not a demand to use every metric on every problem. It is a way of making the evaluation assumptions visible.

## What this means for graph autoencoders

Graph autoencoders can learn representations by reconstructing structure, attributes or both. But lower reconstruction error does not automatically imply better anomaly detection.

The mapping from reconstruction errors to anomaly scores—normalization, weighting, sampling, and whether a model can reconstruct anomalous structures—must be studied under the same evaluation rules as the encoder itself.

I discuss the modeling side in my earlier [guide to graph autoencoders for anomaly detection](/insights/graph-anomaly-detection-autoencoders). The companion [public Graph Anomaly Detection repository](https://github.com/ahmadrastibarzoki/graph-anomaly-detection) offers a clean-room implementation context.

## The conclusion: evaluate the claim, not just the score

The question is not simply whether a new method produces a higher number. It is whether that number comes from a fair experiment, under a clearly defined information boundary, with metrics that reflect the task.

In my view, **a modest model with a transparent evaluation can be more useful than a complex model whose results are difficult to reproduce**.

If we want graph anomaly detection systems people can trust, evaluation design is part of the engineering—not a final step after modeling.

## Related reading

- [Graph Anomaly Detection with Graph Autoencoders](/insights/graph-anomaly-detection-autoencoders)
- [Selected public projects](/projects)
- [Research interests](/research)
