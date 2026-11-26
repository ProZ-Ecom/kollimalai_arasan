import os
import matplotlib
# Set writable cache directory for matplotlib on Windows
os.environ['MPLCONFIGDIR'] = os.path.join(os.getcwd(), 'tmp_mpl')
os.makedirs(os.environ['MPLCONFIGDIR'], exist_ok=True)

import matplotlib.pyplot as plt
import matplotlib.patches as patches

def draw_use_case_diagram():
    # Set up figure: 16 x 11 inches, 300 DPI, pure white background
    fig, ax = plt.subplots(figsize=(16, 11), dpi=300)
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#FFFFFF')
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 11)
    ax.axis('off')

    # Draw Title Header
    ax.text(8.0, 10.6, "UML USE CASE DIAGRAM: END-TO-END PLATFORM FLOW",
            fontsize=15, fontweight='bold', ha='center', va='center', color='#000000', family='sans-serif')
    ax.text(8.0, 10.3, "KOLLIMALAI ARASAN E-COMMERCE PLATFORM (SYSTEM BOUNDARY)",
            fontsize=10, fontstyle='italic', ha='center', va='center', color='#333333', family='sans-serif')

    # System Boundary Box
    sys_rect = patches.Rectangle((3.2, 0.4), 9.6, 9.6, linewidth=1.5, edgecolor='#000000', facecolor='#FFFFFF')
    ax.add_patch(sys_rect)
    ax.text(3.4, 9.8, "System: Kollimalai Arasan Web Platform", fontsize=9, fontweight='bold', color='#000000')

    # Helper function to draw an actor stick figure
    def draw_actor(x, y, name, role=""):
        # Head
        head = patches.Circle((x, y + 0.35), 0.18, linewidth=1.2, edgecolor='#000000', facecolor='#FFFFFF')
        ax.add_patch(head)
        # Body
        ax.plot([x, x], [y + 0.17, y - 0.22], color='#000000', linewidth=1.2)
        # Arms
        ax.plot([x - 0.25, x + 0.25], [y + 0.05, y + 0.05], color='#000000', linewidth=1.2)
        # Legs
        ax.plot([x, x - 0.22], [y - 0.22, y - 0.55], color='#000000', linewidth=1.2)
        ax.plot([x, x + 0.22], [y - 0.22, y - 0.55], color='#000000', linewidth=1.2)
        # Name
        ax.text(x, y - 0.72, name, fontsize=8.5, fontweight='bold', ha='center', va='top', color='#000000')
        if role:
            ax.text(x, y - 0.90, role, fontsize=7.5, fontstyle='italic', ha='center', va='top', color='#444444')

    # Draw Primary & Secondary Actors
    # Left Side: Users / Customers
    draw_actor(1.5, 8.2, "Customer / Visitor", "Storefront Buyer")
    draw_actor(1.5, 4.8, "Registered Customer", "Returns & Account")
    draw_actor(1.5, 1.8, "Wholesale / B2B Client", "Bulk Inquiries")

    # Right Side: Back-Office & External Systems
    draw_actor(14.5, 8.2, "Store Administrator", "Management & Operations")
    draw_actor(14.5, 5.0, "Logistics / Courier", "ST Courier & Shiprocket")
    draw_actor(14.5, 1.8, "External Gateways", "Razorpay, WhatsApp, SMTP")

    # Helper function to draw a Use Case Ellipse
    def draw_uc(cx, cy, rx, ry, text_lines):
        ellipse = patches.Ellipse((cx, cy), rx * 2, ry * 2, linewidth=1.2, edgecolor='#000000', facecolor='#FFFFFF')
        ax.add_patch(ellipse)
        n_lines = len(text_lines)
        if n_lines == 1:
            ax.text(cx, cy, text_lines[0], fontsize=8, ha='center', va='center', color='#000000')
        elif n_lines == 2:
            ax.text(cx, cy + 0.08, text_lines[0], fontsize=8, ha='center', va='center', color='#000000')
            ax.text(cx, cy - 0.08, text_lines[1], fontsize=8, ha='center', va='center', color='#000000')
        elif n_lines == 3:
            ax.text(cx, cy + 0.14, text_lines[0], fontsize=7.5, ha='center', va='center', color='#000000')
            ax.text(cx, cy, text_lines[1], fontsize=7.5, ha='center', va='center', color='#000000')
            ax.text(cx, cy - 0.14, text_lines[2], fontsize=7.5, ha='center', va='center', color='#000000')

    # Define Use Cases within System Boundary
    # Column 1 (Customer Facing Shopping & Checkout)
    draw_uc(5.5, 9.2, 1.8, 0.45, ["Browse Catalog, Search &", "Filter Multi-Unit Variants"])
    draw_uc(5.5, 8.1, 1.8, 0.45, ["Manage Cart, Wishlist &", "Apply Promotional Coupons"])
    draw_uc(5.5, 7.0, 1.8, 0.45, ["Verify Postal PIN Code &", "Select Nearest Post Office"])
    draw_uc(5.5, 5.9, 1.8, 0.45, ["Choose Payment Mode:", "Razorpay Online vs COD"])
    draw_uc(5.5, 4.8, 1.8, 0.45, ["Submit Return with Unboxing", "Proof Video & Photos"])
    draw_uc(5.5, 3.6, 1.8, 0.45, ["Track Real-time Courier", "AWB Transit Checkpoints"])
    draw_uc(5.5, 2.4, 1.8, 0.45, ["Submit B2B Bulk Order", "Inquiry Form"])
    draw_uc(5.5, 1.2, 1.8, 0.45, ["Post Product Reviews", "& Star Ratings"])

    # Column 2 (Admin, Fulfillment & System Processing)
    draw_uc(10.3, 9.2, 1.8, 0.45, ["Manage Catalog, GST Rates", "& HSN Code Matrix"])
    draw_uc(10.3, 8.1, 1.8, 0.45, ["Process & Confirm Orders", "(9-Stage State Machine)"])
    draw_uc(10.3, 7.0, 1.8, 0.45, ["Dispatch: ST Courier Default /", "Shiprocket 1-Click / Cargo"])
    draw_uc(10.3, 5.9, 1.8, 0.45, ["Generate GST Tax Invoice", "(WEB/YY-YY/XXXX Series)"])
    draw_uc(10.3, 4.8, 1.8, 0.45, ["Stream Return Video via", "RFC 9110 HTTP 206 Engine"])
    draw_uc(10.3, 3.6, 1.8, 0.45, ["Authorize Full (100%) or", "Partial Refund via Gateway"])
    draw_uc(10.3, 2.4, 1.8, 0.45, ["Automate WhatsApp Lifecycle", "Alerts & Marketing Campaigns"])
    draw_uc(10.3, 1.2, 1.8, 0.45, ["Live Inventory Ledger, Audits", "& Trash Bin Recovery"])

    # Associations (Solid Lines)
    def connect(x1, y1, x2, y2, dashed=False, label=""):
        style = '--' if dashed else '-'
        ax.plot([x1, x2], [y1, y2], color='#000000', linestyle=style, linewidth=0.9)
        if label:
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            ax.text(mx, my + 0.08, label, fontsize=6.5, ha='center', va='center',
                    bbox=dict(boxstyle="square,pad=0.1", fc="white", ec="none"))

    # Left Actor Connections
    connect(1.7, 8.2, 3.7, 9.2)
    connect(1.7, 8.2, 3.7, 8.1)
    connect(1.7, 8.2, 3.7, 7.0)
    connect(1.7, 8.2, 3.7, 5.9)

    connect(1.7, 4.8, 3.7, 4.8)
    connect(1.7, 4.8, 3.7, 3.6)
    connect(1.7, 4.8, 3.7, 1.2)

    connect(1.7, 1.8, 3.7, 2.4)

    # Right Actor Connections (Store Admin)
    connect(14.3, 8.2, 12.1, 9.2)
    connect(14.3, 8.2, 12.1, 8.1)
    connect(14.3, 8.2, 12.1, 7.0)
    connect(14.3, 8.2, 12.1, 5.9)
    connect(14.3, 8.2, 12.1, 4.8)
    connect(14.3, 8.2, 12.1, 3.6)
    connect(14.3, 8.2, 12.1, 1.2)

    # Right Actor Connections (Logistics Partner)
    connect(14.3, 5.0, 12.1, 7.0)
    connect(14.3, 5.0, 7.3, 3.6)

    # Right Actor Connections (External Gateways)
    connect(14.3, 1.8, 7.3, 5.9)
    connect(14.3, 1.8, 12.1, 3.6)
    connect(14.3, 1.8, 12.1, 2.4)

    # Internal Inter-Use Case Dependencies (<<include>> / <<extend>>)
    connect(7.3, 5.9, 8.5, 8.1, dashed=True, label="<<triggers>>")
    connect(7.3, 4.8, 8.5, 4.8, dashed=True, label="<<requires>>")
    connect(10.3, 4.35, 10.3, 4.05, dashed=True, label="<<inspects>>")
    connect(8.5, 7.0, 7.3, 3.6, dashed=True, label="<<generates>>")

    plt.tight_layout()
    output_path = os.path.join(os.getcwd(), 'use_case_diagram.png')
    plt.savefig(output_path, dpi=300, facecolor='#FFFFFF', edgecolor='none')
    plt.close()
    print(f"DIAGRAM_SAVED_AT: {output_path}")

if __name__ == '__main__':
    draw_use_case_diagram()

