import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import base64
import io
from .models import EnrichedMetrics


def generate_charts(metrics: EnrichedMetrics) -> dict:
    return {
        "donut_chart": _pass_fail_donut(metrics),
        "category_bar": _failure_by_category(metrics),
        "duration_bar": _duration_by_suite(metrics),
    }


def _fig_to_base64(fig) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, bbox_inches="tight",
                facecolor="white", edgecolor="none")
    buf.seek(0)
    encoded = base64.b64encode(buf.read()).decode("utf-8")
    plt.close(fig)
    return encoded


def _pass_fail_donut(metrics: EnrichedMetrics) -> str:
    parsed = metrics.parsed
    labels, values, colors = [], [], []

    if parsed.total_passed > 0:
        labels.append(f"Passed ({parsed.total_passed})")
        values.append(parsed.total_passed)
        colors.append("#22c55e")
    if parsed.total_failed > 0:
        labels.append(f"Failed ({parsed.total_failed})")
        values.append(parsed.total_failed)
        colors.append("#ef4444")
    if parsed.total_skipped > 0:
        labels.append(f"Skipped ({parsed.total_skipped})")
        values.append(parsed.total_skipped)
        colors.append("#f59e0b")

    if not values:
        values, labels, colors = [1], ["No Data"], ["#94a3b8"]

    fig, ax = plt.subplots(figsize=(7, 4.5))
    wedges, _ = ax.pie(
        values, labels=None, colors=colors,
        wedgeprops=dict(width=0.5, edgecolor="white", linewidth=2),
        startangle=90,
    )
    ax.text(0, 0, f"{metrics.pass_rate}%\nPass Rate",
            ha="center", va="center", fontsize=14, fontweight="bold", color="#1e293b")
    ax.legend(wedges, labels, loc="lower center", ncol=len(labels),
              bbox_to_anchor=(0.5, -0.08), frameon=False, fontsize=11)
    ax.set_title("Test Results Overview", fontsize=15, fontweight="bold",
                 pad=15, color="#1e293b")
    fig.patch.set_facecolor("white")
    return _fig_to_base64(fig)


def _failure_by_category(metrics: EnrichedMetrics) -> str:
    categories = metrics.failure_by_category
    fig, ax = plt.subplots(figsize=(7, 4.5))

    if not categories:
        ax.text(0.5, 0.5, "No failures recorded", ha="center", va="center",
                fontsize=13, color="#64748b", transform=ax.transAxes)
        ax.set_title("Failures by Category", fontsize=15, fontweight="bold", color="#1e293b")
        ax.axis("off")
        return _fig_to_base64(fig)

    sorted_cats = sorted(categories.items(), key=lambda x: x[1], reverse=True)
    cats, counts = zip(*sorted_cats)

    bars = ax.bar(cats, counts, color="#ef4444", edgecolor="white",
                  linewidth=1.5, zorder=3)
    for bar, count in zip(bars, counts):
        ax.text(bar.get_x() + bar.get_width() / 2,
                bar.get_height() + 0.05, str(count),
                ha="center", va="bottom", fontsize=11, fontweight="bold", color="#1e293b")

    ax.set_title("Failures by Category", fontsize=15, fontweight="bold",
                 pad=15, color="#1e293b")
    ax.set_xlabel("Category", fontsize=11, color="#475569")
    ax.set_ylabel("Failure Count", fontsize=11, color="#475569")
    ax.tick_params(axis="x", rotation=20, labelsize=10)
    ax.yaxis.set_major_locator(plt.MaxNLocator(integer=True))
    ax.set_facecolor("#f8fafc")
    ax.grid(axis="y", color="white", linewidth=1.5, zorder=0)
    ax.spines[["top", "right"]].set_visible(False)
    fig.patch.set_facecolor("white")
    fig.tight_layout()
    return _fig_to_base64(fig)


def _duration_by_suite(metrics: EnrichedMetrics) -> str:
    suites = metrics.parsed.suites
    fig, ax = plt.subplots(figsize=(7, 4.5))

    if not suites:
        ax.text(0.5, 0.5, "No suite data", ha="center", va="center",
                fontsize=13, color="#64748b", transform=ax.transAxes)
        ax.axis("off")
        return _fig_to_base64(fig)

    names = [s.name[:25] for s in suites]
    durations = [round(s.duration / 60, 2) for s in suites]

    bars = ax.bar(names, durations, color="#3b82f6", edgecolor="white",
                  linewidth=1.5, zorder=3)
    for bar, dur in zip(bars, durations):
        ax.text(bar.get_x() + bar.get_width() / 2,
                bar.get_height() + 0.2, f"{dur}m",
                ha="center", va="bottom", fontsize=10, fontweight="bold", color="#1e293b")

    ax.set_title("Execution Duration by Suite (min)", fontsize=15,
                 fontweight="bold", pad=15, color="#1e293b")
    ax.set_xlabel("Test Suite", fontsize=11, color="#475569")
    ax.set_ylabel("Duration (min)", fontsize=11, color="#475569")
    ax.tick_params(axis="x", rotation=15, labelsize=10)
    ax.set_facecolor("#f8fafc")
    ax.grid(axis="y", color="white", linewidth=1.5, zorder=0)
    ax.spines[["top", "right"]].set_visible(False)
    fig.patch.set_facecolor("white")
    fig.tight_layout()
    return _fig_to_base64(fig)