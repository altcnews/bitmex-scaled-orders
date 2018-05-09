import React from "react";
import PropTypes from "prop-types";
import numeral from "numeral";
import _ from "lodash";
import ReactTable from "components/ReactTable";
import { Formik, Form, Field } from "formik";
import { Persist } from "formik-persist";
import Yup from "yup";
import { Button, Header, Divider, Confirm } from "semantic-ui-react";
import { RadioButton, RadioButtonGroup } from "form/Radio";
import { TextInput } from "form/TextInput";
import { Flex, Box } from "grid-styled";
import { generateOrders } from "./scaledOrderGenerator";
import { ORDER_DISTRIBUTIONS } from "./constants";

class OrderForm extends React.PureComponent {
  static propTypes = {
    submitting: PropTypes.bool.isRequired
  };

  state = { open: false };

  show = () => this.setState({ open: true });
  handleConfirm = () => this.setState({ open: false });
  handleCancel = () => this.setState({ open: false });

  renderPreview(values) {
    let orders = generateOrders(values);

    // An error
    if (!_.isArray(orders)) {
      orders = [];
    }

    return (
      <React.Fragment>
        <Header as="h3">Order preview</Header>
        <ReactTable
          data={orders}
          minRows={0}
          showPagination={false}
          pageSize={orders.length}
          columns={[
            {
              Header: "Price",
              accessor: "price",
              Cell: ({ value }) => numeral(value).format("0,0"),
              Footer: () => (
                <div>
                  Avg. price:{" "}
                  {numeral(
                    _.sum(orders.map(x => x.price * x.amount)) / values.amount
                  ).format("0,0")}
                </div>
              )
            },
            {
              Header: "Amount",
              accessor: "amount",
              Cell: ({ value }) => numeral(value).format("0,0")
            }
          ]}
        />
      </React.Fragment>
    );
  }

  render() {
    const { submitting } = this.props;

    return (
      <Formik
        initialValues={{
          amount: 10000,
          orderCount: 5,
          priceLower: 8200,
          priceUpper: 8300,
          distribution: "flat"
        }}
        isInitialValid
        onSubmit={vals => {
          const orders = generateOrders(vals);
          const apiOrders = orders.map(x => ({
            symbol: "XBTUSD",
            side: vals.orderType,
            orderQty: x.amount,
            price: x.price,
            ordType: "Limit"
          }));

          this.props.createOrders(apiOrders);
        }}
        validationSchema={props =>
          Yup.object().shape({
            amount: Yup.number()
              .integer()
              .required()
              .min(2),
            orderCount: Yup.number()
              .integer()
              .min(2)
              .max(200)
              .required(),
            priceLower: Yup.number()
              .integer()
              .required()
              .positive(),
            priceUpper: Yup.number()
              .integer()
              .required()
              .positive()
              .moreThan(Yup.ref("priceLower"))
          })
        }
        render={({
          values,
          errors,
          touched,
          handleSubmit,
          handleChange,
          isSubmitting,
          setFieldValue,
          submitForm,
          isValid
        }) => (
          <React.Fragment>
            <Form>
              <Flex mb={2} flexWrap="wrap">
                <Box pr={2} width={[1 / 2]}>
                  <Field
                    label="Quantity USD"
                    name="amount"
                    type="number"
                    min={2}
                    component={TextInput}
                  />
                </Box>
                <Box width={[1 / 2]}>
                  <Field
                    label="Number of orders"
                    name="orderCount"
                    type="number"
                    min={2}
                    component={TextInput}
                  />
                </Box>

                <Box w={1}>
                  <Divider />
                </Box>

                <Box pr={2} width={[1 / 2]}>
                  <Field
                    label="Price upper"
                    name="priceUpper"
                    type="number"
                    component={TextInput}
                  />
                </Box>
                <Box width={[1 / 2]}>
                  <Field
                    label="Price lower"
                    name="priceLower"
                    type="number"
                    component={TextInput}
                  />
                </Box>
              </Flex>

              <Flex mb={2}>
                <Box width={[1, 1 / 2]}>
                  <RadioButtonGroup
                    id="distribution"
                    label="Distribution"
                    value={values.distribution}
                    error={errors.distribution}
                    touched={touched.distribution}
                  >
                    {_.map(ORDER_DISTRIBUTIONS, distribution => (
                      <Field
                        component={RadioButton}
                        name="distribution"
                        id={distribution.key}
                        key={distribution.key}
                        label={distribution.label}
                      />
                    ))}
                  </RadioButtonGroup>
                </Box>
              </Flex>

              <Flex>
                <div style={{ marginLeft: "auto" }}>
                  <Button
                    disabled={!isValid || submitting}
                    type="submit"
                    color="green"
                    onClick={e => {
                      e.preventDefault();

                      setFieldValue("orderType", "Buy");
                      this.show();
                    }}
                  >
                    Buy / long
                  </Button>

                  <Button
                    disabled={!isValid || submitting}
                    type="submit"
                    color="red"
                    onClick={e => {
                      e.preventDefault();

                      setFieldValue("orderType", "Sell");
                      this.show();
                    }}
                  >
                    Sell / short
                  </Button>
                </div>
              </Flex>
              <Persist name="orderForm" />
            </Form>

            {isValid && this.renderPreview(values)}

            <Confirm
              header="Place orders"
              content={`
                Are you sure you want to place a ${String(
                  values.orderType
                ).toUpperCase()} order of ${numeral(values.amount).format(
                "0,0"
              )}?
              `}
              open={this.state.open}
              onCancel={this.handleCancel}
              onConfirm={() => {
                submitForm();
                this.handleConfirm();
              }}
            />
          </React.Fragment>
        )}
      />
    );
  }
}

export { OrderForm };
