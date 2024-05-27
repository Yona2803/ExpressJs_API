import nibabel as nb
import numpy as np
from decimal import Decimal, getcontext
import sys

# Set the context precision to 4 decimal places
getcontext().prec = 4


def process_images(file1_path, file2_path):
    # Set the paths of the NIfTI files
    files = [file1_path, file2_path]

    # Initialize the volumes list
    volumes = []

    # Loop over each NIfTI file
    for file_path in files:
        # Load the NIfTI image using nibabel
        img = nb.load(file_path)

        # Get the data array and calculate the number of non-zero voxels
        data = img.get_fdata()
        num_vox = np.count_nonzero(data)

        # Get the voxel volume from the image header
        voxel_vol = np.prod(img.header.get_zooms())

        # Convert numpy arrays to Python float values
        num_vox = float(num_vox)
        voxel_vol = float(voxel_vol)

        # Calculate the tumor volume for this image
        tumor_vol = Decimal(num_vox) * Decimal(voxel_vol)

        # Append the volume to the list
        volumes.append(tumor_vol)

    # Calculate the difference between the volumes
    delta_vol = volumes[1] - volumes[0]

    # Print the results in the required format
    print(f"{delta_vol},{volumes[1]},{volumes[0]}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python theCode.py <file1_path> <file2_path>")
        sys.exit(1)

    file1_path = sys.argv[1]
    file2_path = sys.argv[2]

    try:
        process_images(file1_path, file2_path)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
