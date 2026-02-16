const UnderDevelopment = () => {
  return (
    <div style={styles.navbar}>
      This feature is under development – Testing purpose only
    </div>
  );
};

const styles = {
  navbar: {
    width: "100%",
    backgroundColor: "#f59e0b",
    color: "#ffffff",
    textAlign: "center",
    padding: "6px 0",
    fontSize: "13px",
    fontWeight: "500",
    letterSpacing: "0.5px",
  },
};

export default UnderDevelopment;
