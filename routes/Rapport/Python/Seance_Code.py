import nibabel as nb
import numpy as np
import matplotlib.pyplot as plt
from decimal import Decimal
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Image,
    Table,
    TableStyle,
)
from reportlab.lib import colors
from io import BytesIO
import tempfile
import shutil
import os


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

    pdf_path = os.path.join("./routes/Rapport/Python/Exported/", "thePDF.pdf")
    file_names_display = ["Volume avant la séance", "Volume après la séance"]

    elements = []
    header_style = ParagraphStyle(
        "header",
        fontSize=36,
        fontName="Helvetica-Bold",
        textTransform="uppercase",
        textColor="black",
        spaceAfter=14,
    )

    Title_Style = ParagraphStyle(
        "header",
        fontSize=14,
        fontName="Helvetica-Bold",
        textTransform="uppercase",
        textColor="black",
        spaceAfter=14,
    )

    header_text = Paragraph("<b>Rapport Séance</b>", header_style)
    image_path = "./routes/Rapport/Python/Assets/Ai_Tray.png"
    image = Image(image_path, width=65, height=65)

    data_section1 = [[header_text, image]]
    table_section1 = Table(data_section1, colWidths=[450, 65], rowHeights=[1])

    table_section1.setStyle(
        TableStyle(
            [
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
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.black),
                ("BOX", (0, 0), (-1, -1), 0.25, colors.black),
            ]
        )
    )

    elements.append(table_section4)
    elements.append(Spacer(1, 15))

    doc = SimpleDocTemplate(pdf_path, pagesize=letter)
    doc.build(elements)
    return str(delta_vol), str(volumes[0]), str(volumes[1]), pdf_path


if __name__ == "__main__":
    import sys

    file1_path = sys.argv[1]
    file2_path = sys.argv[2]
    id_Patient = sys.argv[3]
    id_Seance = sys.argv[4]
    Date_Nais_Patient = sys.argv[5]
    Date_Create = sys.argv[6]

    delta_vol, vol_1, vol_2, pdf_path = process_images(
        file1_path, file2_path, id_Patient, id_Seance, Date_Nais_Patient, Date_Create
    )

    print(f"{delta_vol},{vol_1},{vol_2},{pdf_path}")
