import os


def main():
    log_paths = os.scandir("logs")

    for path in log_paths:
        if "demo.log" in os.path.basename(path):
            continue
        os.remove(path)

    print("Logs removed!")


if __name__ == "__main__":
    main()
