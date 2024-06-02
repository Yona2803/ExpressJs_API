from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Image,
    Table,
    TableStyle,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from matplotlib.backends.backend_pdf import PdfPages
from decimal import Decimal, getcontext
import nibabel as nb
import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
import sys
import os
import matplotlib.pyplot as plt
from io import BytesIO
import shutil
import tempfile


def process_images(
    file1_path, file2_path, id_Patient, id_Seance, Date_Nais_Patient, Date_Create
):
    files = [file1_path, file2_path]
    Userinfo = [id_Patient, id_Seance, Date_Nais_Patient, Date_Create]

    volumes = []
    for file_path in files:
        img = nb.load(file_path)
        data = img.get_fdata()
        num_vox = np.count_nonzero(data)
        voxel_vol = np.prod(img.header.get_zooms())
        num_vox = float(num_vox)
        voxel_vol = float(voxel_vol)
        tumor_vol = Decimal(num_vox) * Decimal(voxel_vol)
        volumes.append(tumor_vol)
    delta_vol = volumes[0] - volumes[1]

    DV_T = delta_vol
    VT_1 = volumes[0]
    VT_2 = volumes[1]

    # print(f"{delta_vol},{volumes[1]},{volumes[0]}")
    with tempfile.TemporaryDirectory() as temp_dir:
        pdf_path = os.path.join(temp_dir, "thePDF.pdf")
        file_names_display = ["Volume avant la séance", "Volume après la séance"]

        elements = []
        # style for header text
        header_style = ParagraphStyle(
            "header",
            fontSize=36,
            fontName="Helvetica-Bold",
            textTransform="uppercase",
            textColor="black",
            spaceAfter=14,
        )

        # Section title style
        Title_Style = ParagraphStyle(
            "header",
            fontSize=14,
            fontName="Helvetica-Bold",
            textTransform="uppercase",
            textColor="black",
            spaceAfter=14,
        )

        # Section 1: Header and Image with flexbox-like layout
        header_text = Paragraph("<b>Rapport Séance</b>", header_style)
        image_path = (
            "./routes/Rapport/Python/Assets/Ai_Tray.png"  # Replace with your image path
        )
        image = Image(image_path, width=65, height=65)

        data_section1 = [[header_text, image]]
        table_section1 = Table(data_section1, colWidths=[450, 65], rowHeights=[1])

        table_section1.setStyle(
            TableStyle(
                [
                    # ("BACKGROUND", (0, 0), (-1, -1), colors.blueviolet),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("TEXTCOLOR", (0, 0), (0, 0), colors.black),
                    ("FONTNAME", (0, 0), (0, 0), "Helvetica-Bold"),
                    ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                ]
            )
        )

        elements.append(table_section1)
        elements.append(Spacer(1, 75))

        # Section 2: Title and Table
        section2_title = Paragraph("info générale", Title_Style)
        title_table = Table([[section2_title]], colWidths=[530])
        title_table.setStyle(
            TableStyle(
                [
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("TEXTCOLOR", (0, 0), (0, 0), colors.black),
                    ("FONTNAME", (0, 0), (0, 0), "Helvetica-Bold"),
                ]
            )
        )
        elements.append(title_table)
        elements.append(Spacer(1, 10))
        data_section2 = [
            [
                "ID Patient  : " + str(Userinfo[0]),
                "Date de naissance : " + str(Userinfo[2]),
            ],
            [
                "Seance N° : " + str(Userinfo[1]),
                "Date de Création    : " + str(Userinfo[3]),
            ],
        ]
        table_section2 = Table(data_section2, colWidths=[110, 385])
        column_style = TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 12),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                ("BACKGROUND", (0, 0), (-1, -1), colors.transparent),
            ]
        )

        table_section2.setStyle(column_style)

        elements.append(table_section2)
        elements.append(Spacer(1, 15))

        # Section 3: Graph (Placeholder)
        Section_title = Paragraph("Diagramme", Title_Style)
        title_table = Table([[Section_title]], colWidths=[530])
        title_table.setStyle(
            TableStyle(
                [
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("TEXTCOLOR", (0, 0), (0, 0), colors.black),
                    ("FONTNAME", (0, 0), (0, 0), "Helvetica-Bold"),
                ]
            )
        )
        elements.append(title_table)
        elements.append(Spacer(1, 10))

        buffer = BytesIO()
        fig, ax = plt.subplots()
        bar_width = 0.25
        opacity = 1
        index = np.arange(len(file_names_display))
        rects1 = ax.bar(
            index - bar_width / 9,
            [float(vol) for vol in volumes],
            bar_width,
            alpha=opacity,
            color=["b", "g"],
            label="Volume Tumoral",
        )
        ax.set_ylabel("Volume Tumoral (mm³)", fontsize=9)
        ax.set_title(
            "Volume Tumoral Avant et Après la Séance", fontsize=12, fontweight="bold"
        )
        ax.set_xticks(index)
        ax.set_xticklabels(file_names_display, fontsize=9)
        ax.legend()
        ax.grid(True, which="both", linestyle="--", linewidth=0.25)
        for i, rect in enumerate(rects1):
            height = rect.get_height()
            ax.text(
                rect.get_x() + rect.get_width() / 2,
                height,
                "{:.2f}".format(height),
                ha="center",
                va="bottom",
                fontsize=9,
                fontweight="bold",
            )

        plt.savefig(buffer, format="png")
        plt.close()
        buffer.seek(0)
        plot_image = Image(buffer, width=456, height=250)
        elements.append(plot_image)
        elements.append(Spacer(1, 25))

        # Section 4: Résultats
        Section_title = Paragraph("Résultats", Title_Style)
        title_table = Table([[Section_title]], colWidths=[530])
        title_table.setStyle(
            TableStyle(
                [
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("TEXTCOLOR", (0, 0), (0, 0), colors.black),
                    ("FONTNAME", (0, 0), (0, 0), "Helvetica-Bold"),
                ]
            )
        )
        elements.append(title_table)
        elements.append(Spacer(1, 10))

        data_section4 = [
            ["Fichier", "(cm³)"],
            ["Volume Avant la séance", "{:.2f}".format(float(VT_1 / 1000))],
            ["Volume Après la séance", "{:.2f}".format(float(VT_2 / 1000))],
            ["Difference de Volume", "{:.2f}".format(float(DV_T / 1000))],
        ]
        paragraph_text = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged."

        table_section4 = Table(data_section4, colWidths=[155, 65])

        table_section4.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("ALIGN", (1, 0), (1, 1), "CENTER"),
                    ("ALIGN", (-1, 0), (1, -1), "CENTER"),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 0), (-1, -1), 12),
                    ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ]
            )
        )

        combined_elements = [
            [
                Spacer(1, 0),
                Paragraph(paragraph_text, getSampleStyleSheet()["BodyText"]),
                table_section4,
                Spacer(1, 0),
            ],
        ]

        combined_table = Table(combined_elements, colWidths=[250])
        combined_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.transparent),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 0), (-1, -1), 12),
                ]
            )
        )
        elements.append(combined_table)
        elements.append(Spacer(1, 15))

        # Section 5: Paragraph
        if DV_T > 0:
            Section_title = Paragraph(
                "La situation s'améliore, la delta V = {:.2f} cm³".format(
                    float(DV_T / 1000)
                ),
                Title_Style,
            )
        elif DV_T < 0:
            Section_title = Paragraph(
                "La situation se détériore, la delta V = {:.2f} cm³".format(
                    float(DV_T / 1000)
                ),
                Title_Style,
            )
        else:
            Section_title = Paragraph(
                "Il n'y a aucun changement dans la taille de la tumeur.",
                Title_Style,
            )

        spacer = Spacer(450, 1)

        elements.append(Section_title)
        doc = SimpleDocTemplate(pdf_path, pagesize=letter)
        doc.build(elements)

        # Copy the PDF to a persistent location
        script_dir = os.path.dirname(os.path.abspath(__file__))
        exported_dir = os.path.join(script_dir, "Exported")
        if not os.path.exists(exported_dir):
            os.makedirs(exported_dir)
        persistent_pdf_path = os.path.join(exported_dir, "thePDF.pdf")
        shutil.copy(pdf_path, persistent_pdf_path)
        print(f"{DV_T},{VT_1},{VT_2},{persistent_pdf_path}")

    return persistent_pdf_path


if __name__ == "__main__":
    file1_path = sys.argv[1]
    file2_path = sys.argv[2]
    id_Patient = sys.argv[3]
    id_Seance = sys.argv[4]
    Date_Nais_Patient = sys.argv[5]
    Date_Create = sys.argv[6]

    try:
        pdf_path = process_images(
            file1_path,
            file2_path,
            id_Patient,
            id_Seance,
            Date_Nais_Patient,
            Date_Create,
        )

        # process_images(file1_path, file2_path, id_Patient, Date_Nais_Patient)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
