open module swim.retail {
  requires transitive swim.api;
  requires swim.server;
  requires swim.service.web;
  requires swim.meta;

  exports swim.retail;
  exports swim.retail.agent;
}
