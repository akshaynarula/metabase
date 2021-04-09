import { modal, popover, restore } from "__support__/cypress";
// NOTE: some overlap with parameters-embedded.cy.spec.js

describe("scenarios > dashboard > parameters", () => {
  beforeEach(() => {
    restore();
    cy.signInAsAdmin();
  });

  it("should be visible if previously added", () => {
    cy.visit("/dashboard/1");
    cy.findByText("Baker").should("not.exist");

    // Add a filter
    cy.icon("pencil").click();
    cy.icon("filter").click();
    cy.findByText("Location").click();
    cy.findByText("City").click();

    // Link that filter to the card
    cy.findByText("Select…").click();
    popover().within(() => {
      cy.findByText("City").click();
    });

    // Create a default value and save filter
    cy.findByText("No default").click();
    cy.findByPlaceholderText("Search by City")
      .click()
      .type("B");
    cy.findByText("Baker").click();
    cy.findByText("Add filter").click();
    cy.get(".Button--primary")
      .contains("Done")
      .click();

    cy.findByText("Save").click();
    cy.findByText("You're editing this dashboard.").should("not.exist");
    cy.findByText("Baker");

    cy.log(
      "**Filter should be set and applied after we leave and back to the dashboard**",
    );
    cy.visit("/");
    cy.findByText("Browse all items").click();
    cy.findByText("Orders in a dashboard").click();
    cy.findByText("Baker");
  });

  it("should search across multiple fields", () => {
    cy.createDashboard("my dash");

    cy.visit("/collection/root");
    cy.findByText("my dash").click();

    // add the same question twice
    cy.icon("pencil").click();
    addQuestion("Orders, Count");
    addQuestion("Orders, Count");

    // add a category filter
    cy.icon("filter").click();
    cy.contains("String").click();
    cy.findByText("Dropdown").click();

    // connect it to people.name and product.category
    // (this doesn't make sense to do, but it illustrates the feature)
    selectFilter(cy.get(".DashCard").first(), "Name");
    selectFilter(cy.get(".DashCard").last(), "Category");

    // finish editing filter and save dashboard
    cy.contains("Save").click();

    // wait for saving to finish
    cy.contains("You're editing this dashboard.").should("not.exist");

    // confirm that typing searches both fields
    cy.contains("String").click();

    // After typing "Ga", you should see this name
    popover()
      .find("input")
      .type("Ga");
    popover().contains("Gabrielle Considine");

    // Continue typing a "d" and you see "Gadget"
    popover()
      .find("input")
      .type("d");
    popover()
      .contains("Gadget")
      .click();

    popover()
      .contains("Add filter")
      .click();

    // There should be 0 orders from someone named "Gadget"
    cy.get(".DashCard")
      .first()
      .contains("0");
    // There should be 4939 orders for a product that is a gadget
    cy.get(".DashCard")
      .last()
      .contains("4,939");
  });

  it("should query with a 2 argument parameter", () => {
    cy.createDashboard("my dash");

    cy.visit("/collection/root");
    cy.findByText("my dash").click();

    // add a question
    cy.icon("pencil").click();
    addQuestion("Orders, Count");

    // add a Number - Between filter
    cy.icon("filter").click();
    cy.contains("Number").click();
    cy.findByText("Between").click();

    // map the parameter to the Rating field
    selectFilter(cy.get(".DashCard"), "Rating");

    // finish editing filter and save dashboard
    cy.contains("Save").click();

    // wait for saving to finish
    cy.contains("You're editing this dashboard.").should("not.exist");

    // populate the filter inputs
    cy.contains("Between").click();
    popover()
      .find("input")
      .first()
      .type("3");

    popover()
      .find("input")
      .last()
      .type("4");

    popover()
      .contains("Add filter")
      .click();

    // There should be 8849 orders with a rating >= 3 && <= 4
    cy.get(".DashCard").contains("8,849");
    cy.url().should("include", "between=3&between=4");
  });

  it("should not search field for results non-exact parameter string operators", () => {
    cy.visit("/dashboard/1");

    // Add a filter tied to a field that triggers a search for field values
    cy.icon("pencil").click();
    cy.icon("filter").click();
    cy.findByText("String").click();
    cy.findByText("Starts with").click();

    // Link that filter to the card
    cy.findByText("Select…").click();
    popover().within(() => {
      cy.findByText("City").click();
    });

    // Add a filter with few enough values that it does not search
    cy.icon("filter").click();
    cy.findByText("String").click();
    cy.findByText("Ends with").click();

    // Link that filter to the card
    cy.findByText("Select…").click();
    popover().within(() => {
      cy.findByText("Category").click();
    });

    cy.findByText("Save").click();
    cy.findByText("You're editing this dashboard.").should("not.exist");

    cy.contains("String starts with").click();
    cy.findByPlaceholderText("Enter some text")
      .click()
      .type("Bake");
    cy.findByText("Baker").should("not.exist");
    cy.findByText("Add filter").click();

    cy.contains("String ends with").click();
    cy.findByPlaceholderText("Enter some text")
      .click()
      .type("dget");
    cy.findByText("Widget").should("not.exist");
    cy.findByText("Add filter").click();
  });

  it("should remove previously deleted dashboard parameter from URL (metabase#10829)", () => {
    // Mirrored issue in metabase-enterprise#275

    // Go directly to "Orders in a dashboard" dashboard
    cy.visit("/dashboard/1");

    // Add filter and save dashboard
    cy.icon("pencil").click();
    cy.icon("filter").click();
    cy.contains("String").click();
    cy.contains("Ends with").click();

    // map the parameter to the Category field
    selectFilter(cy.get(".DashCard"), "Category");

    cy.findByText("Save").click();

    // wait for saving to finish
    cy.contains("You're editing this dashboard.").should("not.exist");

    // populate the filter input
    cy.findByText("String ends with").click();
    popover()
      .find("input")
      .type("zmo");

    popover()
      .contains("Add filter")
      .click();

    cy.log(
      "**URL is updated correctly with the given parameter at this point**",
    );
    cy.url().should("include", "string_ends_with=zmo");

    // Remove filter name
    cy.icon("pencil").click();
    cy.get(".Dashboard")
      .find(".Icon-gear")
      .click();
    cy.findByDisplayValue("String ends with")
      .click()
      .clear();
    cy.findByText("Save").click();
    cy.findByText("You're editing this dashboard.").should("not.exist");

    cy.log("Filter name should be 'unnamed' and the value cleared");
    cy.findByText(/unnamed/i);

    cy.log("URL should reset");
    cy.location("pathname").should("eq", "/dashboard/1");
  });

  it("should allow linked question to be changed without breaking (metabase#9299)", () => {
    cy.visit("/");
    cy.findByText("Ask a question").click();
    cy.findByText("Native query").click();
    cy.get(".ace_content")
      .as("editor")
      .click()
      .type("SELECT * FROM ORDERS WHERE {{filter}}", {
        parseSpecialCharSequences: false,
      });
    // make {{filter}} a "Field Filter" connected to `Orders > Created At`
    cy.get(".AdminSelect")
      .contains("Text")
      .click();
    cy.findByText("Field Filter").click();
    popover().within(() => {
      cy.findByText("Sample Dataset");
      cy.findByText("Orders").click();
      cy.findByText("Created At").click();
    });
    cy.findByText("Save").click();

    cy.findByPlaceholderText("What is the name of your card?")
      .click()
      .type("DashQ");
    cy.get(".Modal").within(() => {
      cy.findByText("Save").click();
    });
    // add question to existing dashboard, rather than creating a new one
    cy.findByText("Yes please!").click();
    cy.findByText("Orders in a dashboard").click();

    // it automatically switches to that dashboard and enters the editing mode
    cy.findByText("You're editing this dashboard.");

    cy.icon("filter").click();
    cy.findByText("Time").click();
    cy.findByText("All Options").click();
    // update the filter with the default option "Previous 30 days"
    // it will automatically be selected - just press "Update filter"
    cy.findByText("No default").click();
    cy.findByText("Update filter").click();

    // connect that filter to the second card/question (dashboard already had one question previously)
    cy.get(".DashCard")
      .last()
      .contains("Select")
      .click();
    popover()
      .contains("Filter")
      .click();
    // save the dashboard
    cy.findByText("Save").click();
    cy.findByText("You're editing this dashboard.").should("not.exist");

    cy.visit("/");
    // find and edit the question
    cy.findByText("Browse all items").click();
    cy.findByText("DashQ").click();
    cy.findByText("Open Editor").click();

    // remove the connected filter from the question...
    cy.get("@editor")
      .click()
      .type("{selectall}{backspace}") // cannot use `clear()` on a custom (unsupported) element
      .type("{selectall}{backspace}") // repeat because sometimes Cypress fails to clear everything
      .type("SELECT * from ORDERS");
    cy.findByText("Save").click();

    // ... and save it (override the current one is selected by default - just press "Save")
    cy.get(".Modal").within(() => {
      cy.findByText("Save").click();
    });
    cy.findByText("New question").should("not.exist");

    cy.log("Bug was breaking the dashboard at this point");
    cy.visit("/dashboard/1");
    // error was always ending in "is undefined" when dashboard broke in the past
    cy.contains(/is undefined$/).should("not.exist");
    cy.findByText("Orders in a dashboard");
    cy.findByText("DashQ");
  });
});

function selectFilter(selection, filterName) {
  selection.contains("Select…").click();
  popover()
    .contains(filterName)
    .click({ force: true });
}

function addQuestion(name) {
  cy.get(".DashboardHeader .Icon-add").click();
  modal()
    .contains(name)
    .click();
}
