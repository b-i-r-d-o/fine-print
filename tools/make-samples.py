"""Generates FICTIONAL sample agreements for the Fine Print demo.
The lease's property manager uses Joann's own name (Quan Yuan) at her request, with a made-up
company (Drop Tine Properties Ltd.), phone and email; every other detail is invented.
Run: python3 tools/make-samples.py  -> samples/sample-alberta-lease.pdf, samples/sample-mortgage.pdf
"""
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors

styles = getSampleStyleSheet()
H1 = ParagraphStyle("h1", parent=styles["Title"], fontSize=17, spaceAfter=6)
H2 = ParagraphStyle("h2", parent=styles["Heading2"], fontSize=11.5, spaceBefore=10, spaceAfter=4)
P = ParagraphStyle("p", parent=styles["BodyText"], fontSize=9.6, leading=13, spaceAfter=5)
SMALL = ParagraphStyle("s", parent=P, fontSize=8, textColor=colors.grey)
SIG = ParagraphStyle("sig", parent=P, fontName="Helvetica-Oblique", fontSize=12)


def footer(text):
    def draw(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(colors.grey)
        canvas.drawString(0.75 * inch, 0.5 * inch, text)
        canvas.drawRightString(7.75 * inch, 0.5 * inch, f"Page {doc.page}")
        canvas.restoreState()
    return draw


def table(rows, widths=(2.1 * inch, 4.6 * inch)):
    t = Table([[Paragraph(f"<b>{a}</b>", P), Paragraph(b, P)] for a, b in rows], colWidths=widths)
    t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.4, colors.lightgrey), ("VALIGN", (0, 0), (-1, -1), "TOP"),
                           ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F4F1EC"))]))
    return t


def clauses(items):
    out = []
    for i, (title, body) in enumerate(items, 1):
        out.append(Paragraph(f"{i}. {title}", H2))
        for para in body:
            out.append(Paragraph(para, P))
    return out


# ---------------------------------------------------------------- LEASE
def lease():
    path = "samples/sample-alberta-lease.pdf"
    doc = SimpleDocTemplate(path, pagesize=letter, leftMargin=0.75 * inch, rightMargin=0.75 * inch,
                            topMargin=0.7 * inch, bottomMargin=0.8 * inch,
                            title="Residential Tenancy Agreement (Fixed Term) - SAMPLE", author="Drop Tine Properties Ltd. (fictional)")
    s = []
    s.append(Paragraph("RESIDENTIAL TENANCY AGREEMENT", H1))
    s.append(Paragraph("Fixed-Term Tenancy · Province of Alberta", ParagraphStyle("sub", parent=P, alignment=1, fontSize=11)))
    s.append(Paragraph("Agreement No. DT-2025-0417", ParagraphStyle("sub2", parent=SMALL, alignment=1)))
    s.append(Spacer(1, 8))
    s.append(Paragraph("This Agreement is made on <b>August 15, 2025</b> between the Landlord and the Tenant named below "
                       "for the residential premises described below, under the <i>Residential Tenancies Act</i> (Alberta).", P))
    s.append(table([
        ("Landlord", "Drop Tine Properties Ltd."),
        ("Landlord's agent / property manager", "Quan Yuan, Property Manager"),
        ("Landlord contact", "Phone: 587-000-0000 · Email: demotest@droptine.example"),
        ("Tenant(s)", "Ballerina Cappucina"),
        ("Tenant contact", "Phone: 780-555-0199 · Email: ballerina.cappucina@mail.example"),
        ("Rental premises", "Unit 204, 10123 – 99 Avenue, Grande Prairie, Alberta T8V 0R5"),
        ("Parking", "One assigned stall, #17 (included)"),
    ]))
    s += clauses([
        ("Term of Tenancy", [
            "This is a <b>fixed-term tenancy</b> beginning on <b>September 1, 2025</b> and ending on <b>August 31, 2026</b>.",
            "A fixed-term tenancy ends on the date stated above. No notice is required by either party to end the tenancy on that date. "
            "If the Landlord and Tenant agree to continue the tenancy after the end date without signing a new fixed-term agreement, "
            "the tenancy will continue as a month-to-month periodic tenancy on the same terms.",
        ]),
        ("Rent", [
            "Rent is <b>$1,450.00 per month</b>, payable in advance on the <b>first (1st) day of each month</b>.",
            "Rent is payable by electronic transfer to demotest@droptine.example or by post-dated cheques delivered to the property manager.",
            "A late payment fee of $25.00 applies to rent received after the 3rd day of the month.",
        ]),
        ("Security Deposit", [
            "The Tenant has paid a security deposit of <b>$1,450.00</b>. The Landlord will hold the deposit in a trust account and pay "
            "interest as required by the <i>Residential Tenancies Act</i>.",
            "Within 10 days after the Tenant gives up possession, the Landlord will return the deposit with interest, or provide a statement "
            "of account setting out deductions for unpaid rent or damage beyond normal wear and tear.",
        ]),
        ("Inspection Reports", [
            "A move-in inspection was completed on September 1, 2025 and signed by both parties. A move-out inspection will be "
            "completed within one week before or after the Tenant gives up possession.",
        ]),
        ("Utilities and Services", [
            "Included in rent: water, sewer, garbage, heat. Paid by the Tenant: electricity, internet, tenant insurance.",
        ]),
        ("Use and Occupancy", [
            "The premises may be occupied only by the Tenant named above. No subletting or assignment without the Landlord's written consent, "
            "which will not be unreasonably withheld.",
            "No smoking or vaping in the unit or on the balcony. One small pet permitted with written approval.",
        ]),
        ("Tenant Insurance", [
            "The Tenant must maintain tenant's liability insurance of at least $1,000,000 for the length of the tenancy and provide "
            "proof on request.",
        ]),
        ("Maintenance and Repairs", [
            "The Tenant will keep the premises reasonably clean and report needed repairs promptly to the property manager. "
            "The Landlord will maintain the premises in compliance with the Minimum Housing and Health Standards.",
        ]),
        ("Entry by Landlord", [
            "The Landlord may enter the premises with at least 24 hours' written notice for inspection, repairs or showing, "
            "between 8:00 a.m. and 8:00 p.m., except on a day of religious observance of the Tenant. No notice is required in an emergency.",
        ]),
        ("Notices", [
            "Notices from the Tenant to the Landlord may be given in writing to the Landlord's property manager. "
            "Notices from the Landlord to the Tenant may be given in person or delivered to the rental premises.",
        ]),
        ("Rules", [
            "The Tenant agrees to follow the building rules provided at move-in. Quiet hours are 10:00 p.m. to 7:00 a.m.",
        ]),
        ("Entire Agreement", [
            "This Agreement, the move-in inspection report and the building rules form the entire agreement between the parties. "
            "Any change must be in writing and signed by both parties.",
        ]),
    ])
    s.append(Spacer(1, 10))
    s.append(Paragraph("SIGNATURES", H2))
    sig = Table([
        [Paragraph("<b>Landlord</b> (by its agent)", P), Paragraph("<b>Tenant</b>", P)],
        [Paragraph("Quan Yuan", SIG), Paragraph("Ballerina Cappucina", SIG)],
        [Paragraph("Quan Yuan, for Drop Tine Properties Ltd.", P), Paragraph("Ballerina Cappucina", P)],
        [Paragraph("Date: August 15, 2025", P), Paragraph("Date: August 15, 2025", P)],
    ], colWidths=(3.35 * inch, 3.35 * inch))
    sig.setStyle(TableStyle([("LINEBELOW", (0, 1), (-1, 1), 0.6, colors.black), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
    s.append(sig)
    s.append(Spacer(1, 14))
    s.append(Paragraph("FICTIONAL SAMPLE DOCUMENT created for the Fine Print hackathon demo. All names, companies, addresses, "
                       "phone numbers and emails are invented. Not a legal form.", SMALL))
    note = footer("Residential Tenancy Agreement · DT-2025-0417 · FICTIONAL SAMPLE")
    doc.build(s, onFirstPage=note, onLaterPages=note)
    print("wrote", path)


# ---------------------------------------------------------------- MORTGAGE
def mortgage():
    path = "samples/sample-mortgage.pdf"
    doc = SimpleDocTemplate(path, pagesize=letter, leftMargin=0.75 * inch, rightMargin=0.75 * inch,
                            topMargin=0.7 * inch, bottomMargin=0.8 * inch,
                            title="Mortgage Agreement - SAMPLE", author="Aurora Hearth Mortgage Corp. (fictional)")
    s = []
    s.append(Paragraph("MORTGAGE AGREEMENT", H1))
    s.append(Paragraph("Residential First Mortgage · Fixed Rate", ParagraphStyle("sub", parent=P, alignment=1, fontSize=11)))
    s.append(Paragraph("Mortgage No. AHM-77-30215", ParagraphStyle("sub2", parent=SMALL, alignment=1)))
    s.append(Spacer(1, 8))
    s.append(table([
        ("Lender", "Aurora Hearth Mortgage Corp."),
        ("Lender contact", "Priya Raman, Mortgage Specialist · Phone: 1-800-555-0177 · Email: priya.raman@aurorahearth.example"),
        ("Lender address", "Suite 900, 4400 Gateway Boulevard NW, Edmonton, Alberta T6H 0A1"),
        ("Borrower(s)", "Ballerina Cappucina"),
        ("Mortgaged property", "4812 – 37 Street, Grande Prairie, Alberta T8W 1C4"),
        ("Principal amount", "$385,000.00"),
        ("Interest rate", "4.79% per year, fixed, compounded semi-annually, not in advance"),
        ("Term", "5 years, from October 15, 2025 to <b>October 15, 2030</b> (maturity / renewal date)"),
        ("Amortization", "25 years"),
        ("Regular payment", "<b>$2,186.40 per month</b>, on the <b>15th day of each month</b>"),
        ("First payment date", "November 15, 2025"),
        ("Closing / advance date", "October 15, 2025"),
    ]))
    s += clauses([
        ("Promise to Pay", ["The Borrower promises to repay the principal with interest at the rate and on the dates set out above."]),
        ("Prepayment Privileges", [
            "Once each year the Borrower may prepay up to 15% of the original principal without charge, and may increase the regular "
            "payment by up to 15% once each year. Other prepayments are subject to a charge equal to the greater of three months' interest "
            "or the interest rate differential.",
        ]),
        ("Property Insurance", [
            "The Borrower must keep the property insured against fire and other perils for its full replacement value, with the Lender "
            "named as first loss payee, and must provide <b>proof of insurance each year by October 15</b>, and whenever the policy renews or changes.",
        ]),
        ("Property Taxes", [
            "The Borrower will pay all property taxes when due and provide the Lender with <b>proof of payment by July 31 of each year</b>.",
        ]),
        ("Occupancy", [
            "The Borrower represents that the property will be owner-occupied as the Borrower's principal residence. The property may not "
            "be rented in whole or used as a short-term rental without the Lender's prior written consent.",
        ]),
        ("Renewal", [
            "The Lender will send a renewal offer at least <b>21 days before the maturity date</b>. If the mortgage is not renewed or repaid "
            "by maturity, the balance becomes due.",
        ]),
        ("Default", [
            "If a payment is missed or a condition is broken, the full balance may become due. An NSF fee of $45.00 applies to each "
            "returned payment.",
        ]),
        ("Portability", ["The Borrower may port this mortgage to a new property within 90 days of selling, subject to approval."]),
    ])
    s.append(Spacer(1, 10))
    s.append(Paragraph("SIGNATURES", H2))
    sig = Table([
        [Paragraph("<b>Borrower</b>", P), Paragraph("<b>Lender</b>", P)],
        [Paragraph("Ballerina Cappucina", SIG), Paragraph("Priya Raman", SIG)],
        [Paragraph("Ballerina Cappucina", P), Paragraph("Priya Raman, for Aurora Hearth Mortgage Corp.", P)],
        [Paragraph("Date: October 8, 2025", P), Paragraph("Date: October 8, 2025", P)],
    ], colWidths=(3.35 * inch, 3.35 * inch))
    sig.setStyle(TableStyle([("LINEBELOW", (0, 1), (-1, 1), 0.6, colors.black), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
    s.append(sig)
    s.append(Spacer(1, 14))
    s.append(Paragraph("FICTIONAL SAMPLE DOCUMENT created for the Fine Print hackathon demo. All names, companies, addresses, "
                       "phone numbers and emails are invented. Not a legal form.", SMALL))
    note = footer("Mortgage Agreement · AHM-77-30215 · FICTIONAL SAMPLE")
    doc.build(s, onFirstPage=note, onLaterPages=note)
    print("wrote", path)


if __name__ == "__main__":
    import shutil, os
    lease()
    mortgage()
    os.makedirs("public/samples", exist_ok=True)  # so they can be opened/saved from the live app link
    for f in ("sample-alberta-lease.pdf", "sample-mortgage.pdf"):
        shutil.copy(f"samples/{f}", f"public/samples/{f}")
