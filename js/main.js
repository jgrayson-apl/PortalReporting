define([
  "dojo/ready",
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/connect",
  "dojo/_base/Deferred",
  "dojo/promise/all",
  "dojo/aspect",
  "dojo/json",
  "dojo/on",
  "dojo/dom",
  "dojo/dom-construct",
  "dojo/date",
  "dojo/date/locale",
  "dojo/number",
  "dijit/registry",
  "dijit/Dialog",
  "dijit/form/Button",
  "dojo/data/ObjectStore",
  "dojo/store/Memory",
  "dojo/store/Observable",
  "dgrid/OnDemandGrid",
  "dgrid/extensions/DijitRegistry",
  "put-selector/put",
  "esri/request",
  "esri/arcgis/utils",
  "esri/arcgis/Portal",
  "esri/IdentityManager"
], function (ready, declare, lang, array, connect, Deferred, all, aspect, json, on, dom, domConstruct, date, locale, number, registry, Dialog, Button, ObjectStore, Memory, Observable, OnDemandGrid, DijitRegistry, put, esriRequest, arcgisUtils, esriPortal, IdentityManager) {

  return declare("", null, {

    /**
     *
     */
    config: {},

    /**
     *
     */
    variablesByType: {
      "stg.portal": {vars: ["stg"], task: "", desc: "Storage usage of Files on Portal", other: ""},
      "stg.tiles": {vars: ["stg"], task: "", desc: "Storage usage of Tile Services", other: ""},
      "stg.features": {vars: ["stg"], task: "", desc: "Storage usage of Feature Services", other: ""},
      "tilegencnt.tiles": {
        vars: ["num"],
        task: "",
        desc: "Amount of tiles generated.",
        other: "(both etypes are acceptable and equivalent). etype should be considered like the 'gen' etype but is not because of legacy reasons."
      },
      "loading.tiles": {
        vars: ["credits"],
        task: "",
        desc: "A number that represents the number of bundles loaded.",
        other: ""
      },
      "svcusg.portal": {
        vars: ["num", "bw"],
        task: "",
        desc: "Number of downloads done and bandwidth used.",
        other: "Bandwidth is the variable used to charge credits."
      },
      "svcusg.tiles": {
        vars: ["num", "bw"],
        task: "",
        desc: "Usage of tile services, including the number of requests and bandwidth used.",
        other: "Bandwidth is the variable used to charge credits."
      },
      "svcusg.features": {
        vars: ["num", "bw"],
        task: "",
        desc: "Usage of feature services, including the number of requests and bandwidth used.",
        other: "Bandwidth is the variable used to charge credits."
      },
      "geocodecnt.geocode": {
        vars: ["num"],
        task: "",
        desc: "Number of Batch Geocodes made.",
        other: " (both etypes are acceptable and equivalent). etype should be considered like the 'svcusg' etype but because of legacy reasons is not."
      },
      "svcusg.nasimpleroute": {vars: ["num"], task: "", desc: "Number of Simple Routes made.", other: ""},
      "svcusg.natsproute": {vars: ["num"], task: "", desc: "Number of Optimized routes made.", other: ""},
      "svcusg.nacfroute": {vars: ["num"], task: "", desc: "Number of closest facility routes made.", other: ""},
      "svcusg.naservicearea": {vars: ["num"], task: "", desc: "Number of service area requests.", other: ""},
      "svcusg.navrproute": {vars: ["num"], task: "", desc: "Number of Vehicle Routing (VRP) routes.", other: ""},
      "svcusg.geoenrich": {
        vars: ["credits", "num"],
        task: "display,report,geoenrich",
        desc: "Number of areas/inputs and cost for GeoEnrichment services.",
        other: "Credits are calculated against the cost variable."
      },
      "svcusg.geotrigger": {vars: ["num"], task: "", desc: "Number of geotrigger calls", other: ""},
      "svcusg.spanalysis": {
        vars: ["credits", "num"],
        task: "AggregatePoints, FindHotSpots, CreateBuffers, CreateDriveTimeAreas, DissolveBoundaries, MergeLayers, SummarizeWithin, SummarizeNearby, EnrichLayer, OverlayLayers, ExtractData, FindNearest",
        desc: "Number of requests to Spatial Analsysis.",
        other: "Credits are calculated against the cost variable."
      },
      "svcusg.demogmaps": {
        vars: ["credits", "num"],
        task: "export,infographics",
        desc: "Number of requests to Demographic Maps.",
        other: "Credits are calculated against the num variable."
      },
      "svcusg.applogin": {
        vars: ["num"],
        task: "",
        desc: "Number of application logins (for tracking purposes)",
        other: ""
      },
      "svcusg.apploginprovider": {
        vars: ["num"],
        task: "",
        desc: "Number of application logins (for tracking purposes) from the point of view of the appOrgId provider. For marketplace use cases.",
        other: ""
      },
      "svcusg.premiummaps": {
        vars: ["num", "credits"],
        task: "export,infographics,dataquery",
        desc: "Number of requests to premium map services.",
        other: "cost records the number of features in a query."
      },
      "svcusg.premiumimagery": {
        vars: ["num", "credits"],
        task: "export,infographics,download,dataquery",
        desc: "Number of requests to premium imagery services.",
        other: ""
      },
      "svcusg.premiumfeatures": {
        vars: ["num", "credits"],
        task: "",
        desc: "Number of requests to premium feature services.",
        other: ""
      },
      "svcusg.landscapemaps": {
        vars: ["num", "credits"],
        task: "export,infographics,dataquery",
        desc: "Number of requests to landscape map services.",
        other: ""
      },
      "svcusg.landscapeimagery": {
        vars: ["num", "credits"],
        task: "export,infographics,download,dataquery",
        desc: "Number of requests to landscape imagery services.",
        other: ""
      },
      "svcusg.landscapeanalysis": {
        vars: ["num", "credits"],
        task: "",
        desc: "Number of requests to landscape analysis services.",
        other: ""
      },
      "svcusg.elevanalysis": {
        vars: ["num", "credits"],
        task: "",
        desc: "Number of requests to Elevation Analysis. Credits are calculated against the cost variable. ",
        other: "Task used in analysis."
      }
    },

    /**
     *
     * @param config
     */
    constructor: function (config) {
      lang.mixin(this.config, config);

      this.orgChart = null;

      this.config.sharinghost = this.config.sharinghost || (location.protocol + "//www.arcgis.com");
      arcgisUtils.arcgisUrl = this.config.sharinghost + "/sharing/rest/content/items";

      ready(lang.hitch(this, function () {
        connect.connect(registry.byId('centerContainer'), 'selectChild', lang.hitch(this, this.reportOptionSelected));

        this.initDateInputs();
        this.initReportGrids();
        this.loginToArcGIS();
      }));
    },

    /**
     *
     */
    initDateInputs: function () {
      var today = new Date();
      var fourWeeksAgo = date.add(today, 'week', -4);
      registry.byId('startDateInput').set('value', fourWeeksAgo);
      registry.byId('endDateInput').set('value', today);
    },

    /**
     *
     */
    loginToArcGIS: function () {

      var portal = new esriPortal.Portal(this.config.sharinghost);
      portal.on('load', lang.hitch(this, function () {
        portal.signIn().then(lang.hitch(this, function (loggedInUser) {
          this.portalUser = loggedInUser;

          if(this.portalUser.role !== "org_admin") {
            alert("This application is for Organization Administrators.");

          } else {

            put(dom.byId('userImageNode'), 'img.userImageNode', {
              src: lang.replace("{thumbnailUrl}?token={credential.token}", this.portalUser),
              alt: "User Image",
              onclick: function () {
                window.open("http://mediawikidev.esri.com/index.php/ArcGIS.com/Credit_and_Reporting_APIs");
              }
            });
            put(dom.byId('orgNameNode'), 'div', portal.name);
            put(dom.byId('userNameNode'), 'div', this.portalUser.fullName);
            put(dom.byId('creditsNode'), 'div', number.format(portal.availableCredits, {places: 0}));
            put(dom.byId('availableLabelNode'), 'div', 'available credits');

            this.getPortalUsers().then(lang.hitch(this, function (portalUsers) {
              this.portalUsers = portalUsers;

              // GET USAGE REPORTS //
              this.updateUsageReports().then(lang.hitch(this, function () {
                registry.byId('mainContainer').layout();
              }), lang.hitch(this, function (error) {
                console.warn(error);
              }));

              registry.byId('getUsageReportBtn').on('click', lang.hitch(this, this.updateUsageReports));

              registry.byId('userTypeSelect').on('change', lang.hitch(this, this.filterResults, true));
              registry.byId('usernameSelect').on('change', lang.hitch(this, this.filterResults, false));
              registry.byId('serviceNamesSelect').on('change', lang.hitch(this, this.filterResults, false));
              registry.byId('applicationIdSelect').on('change', lang.hitch(this, this.filterResults, false));
              registry.byId('serviceTypeSelect').on('change', lang.hitch(this, this.filterResults, false));

              registry.byId('startDateInput').on('change', lang.hitch(this, this.updateUsageReportBtn));
              registry.byId('endDateInput').on('change', lang.hitch(this, this.updateUsageReportBtn));
              registry.byId('periodInput').on('change', lang.hitch(this, this.updateUsageReportBtn));
              registry.byId('periodSelect').on('change', lang.hitch(this, this.updateUsageReportBtn));

            }));
          }
        }));
      }));

    },

    /**
     *
     * @returns {*}
     */
    getPortalUsers: function () {
      var deferred = new Deferred();

      esriRequest({
        url: lang.replace('{portalUrl}portals/{id}/users', this.portalUser.portal),
        content: {
          f: 'json',
          num: 1000
        }
      }).then(lang.hitch(this, function (response) {
        deferred.resolve(response.users);
      }), deferred.reject);

      return deferred.promise;
    },

    /**
     *
     * @param username
     * @returns {*}
     */
    isOrganizationUser: function (username) {
      if(this.portalUsers) {
        return array.some(this.portalUsers, function (portalUser) {
          return (portalUser.username === username)
        });
      } else {
        return false;
      }
    },


    /**
     *
     */
    initReportGrids: function () {

      var usageStore = new Memory({
        idProperty: "username",
        data: []
      });


      this.usageGrid = declare([OnDemandGrid, DijitRegistry])({
        store: usageStore,
        bufferRows: Infinity,
        sort: "username",
        columns: {
          type: {
            label: "Type",
            sortable: true,
            renderCell: lang.hitch(this, function (object, value, node, options) {
              if(object.variable) {
                return put('div.serviceType', {
                  innerHTML: object.variable ? object.variable.desc : "NO VARIABLE",
                  title: object.variable.other
                });
              } else {
                console.warn(object, value);
              }
            })
          },
          username: {
            label: "Username",
            sortable: true,
            renderCell: lang.hitch(this, function (object, value, node, options) {
              return put('div.' + object.userType, value);
            })
          },
          name: {
            label: "Service Name",
            sortable: true,
            renderCell: lang.hitch(this, function (object, value, node, options) {
              if(value) {
                return put('a', {
                  href: "javascript:void(0);",
                  innerHTML: value,
                  title: value,
                  onclick: lang.hitch(this, this.showPossibleServices, value, true)
                });
              } else {
                return put('span');
              }

            })
          },
          appId: {
            label: "App Id",
            sortable: true
          },
          num: {
            label: "Number of Requests",
            sortable: false,
            renderCell: lang.hitch(this, this.cellRenderer, 'num', 0)
          },
          bw: {
            label: "Bandwidth",
            sortable: false,
            renderCell: lang.hitch(this, this.cellRenderer, 'bw', 0)
          },
          credits: {
            label: "Credits",
            sortable: false,
            renderCell: lang.hitch(this, this.cellRenderer, 'credits', 6)
          }
        }
      }, "usagePane");
      this.usageGrid.startup();
      aspect.after(this.usageGrid, 'renderArray', lang.hitch(this, this.sourceListUpdated), true);

      this.initServiceTypeSelect();


      this.orgGrid = declare([OnDemandGrid, DijitRegistry])({
        store: usageStore,
        query: {userType: "theOrg"},
        bufferRows: Infinity,
        columns: {
          "type": {
            label: "Type",
            sortable: true,
            renderCell: lang.hitch(this, function (object, value, node, options) {
              return put('div.serviceType', {
                innerHTML: object.variable.desc,
                title: object.variable.other
              })
            })
          },
          num: {
            label: "Number of Requests",
            sortable: false,
            renderCell: lang.hitch(this, this.totalsCellRenderer, 'num', 0)
          },
          bw: {
            label: "Bandwidth",
            sortable: false,
            renderCell: lang.hitch(this, this.totalsCellRenderer, 'bw', 0)
          },
          stg: {
            label: "Storage",
            sortable: false,
            renderCell: lang.hitch(this, this.totalsCellRenderer, 'stg', 0)
          },
          credits: {
            label: "Credits",
            sortable: false,
            renderCell: lang.hitch(this, this.totalsCellRenderer, 'credits', 6)
          }
        }
      }, "orgPane");
      this.orgGrid.startup();


      this.usersGrid = declare([OnDemandGrid, DijitRegistry])({
        store: usageStore,
        query: {userType: "orgUser"},
        bufferRows: Infinity,
        columns: {
          username: {
            label: "Username",
            sortable: true,
            renderCell: lang.hitch(this, function (object, value, node, options) {
              return put('div.' + object.userType, value);
            })
          },
          num: {
            label: "Number of Requests",
            sortable: false,
            renderCell: lang.hitch(this, this.totalsCellRenderer, 'num', 0)
          },
          bw: {
            label: "Bandwidth",
            sortable: false,
            renderCell: lang.hitch(this, this.totalsCellRenderer, 'bw', 0)
          },
          credits: {
            label: "Credits",
            sortable: false,
            renderCell: lang.hitch(this, this.totalsCellRenderer, 'credits', 6)
          }
        }
      }, "usersPane");
      this.usersGrid.startup();


      this.servicesGrid = declare([OnDemandGrid, DijitRegistry])({
        store: usageStore,
        bufferRows: Infinity,
        sort: [
          {attribute: "hostOrgId", descending: true}
        ],
        columns: {
          name: {
            label: "Name",
            sortable: true
          },
          hostOrgId: {
            label: "Host Org",
            sortable: true,
            formatter: lang.hitch(this, function (hostOrgId) {
              return (this.portalUser.portal.id === hostOrgId) ? this.portalUser.portal.name : "";
            })
          },
          num: {
            label: "Number of Requests",
            sortable: false,
            /*get: lang.partial(this.calcTotal2, "num"),
            formatter: this.formatNumericValue*/
            renderCell: lang.hitch(this, this.totalsCellRenderer, 'num', 0)
          },
          bw: {
            label: "Bandwidth",
            sortable: false,
            /*get: lang.partial(this.calcTotal2, "bw"),
            formatter: this.bytesToSize*/
            renderCell: lang.hitch(this, this.totalsCellRenderer, 'bw', 0)
          },
          credits: {
            label: "Credits",
            sortable: false,
            /*get: lang.partial(this.calcTotal2, "credits"),
            formatter: this.formatNumericValue*/
            renderCell: lang.hitch(this, this.totalsCellRenderer, 'credits', 6)
          }
        }
      }, "servicesPane");
      this.servicesGrid.startup();


      this.applicationsGrid = declare([OnDemandGrid, DijitRegistry])({
        store: usageStore,
        bufferRows: Infinity,
        sort: [
          {attribute: "appOrgId", descending: true}
        ],
        columns: {
          appId: {
            label: "App Id",
            sortable: true
          },
          appOrgId: {
            label: "App Org",
            sortable: false,
            formatter: lang.hitch(this, function (appOrgId) {
              return (this.portalUser.portal.id === appOrgId) ? this.portalUser.portal.name : appOrgId;
            })
          },
          num: {
            label: "Number of Requests",
            sortable: false,
            renderCell: lang.hitch(this, this.totalsCellRenderer, 'num', 0)
          },
          bw: {
            label: "Bandwidth",
            sortable: false,
            renderCell: lang.hitch(this, this.totalsCellRenderer, 'bw', 0)
          },
          credits: {
            label: "Credits",
            sortable: false,
            renderCell: lang.hitch(this, this.totalsCellRenderer, 'credits', 6)
          }
        }
      }, "applicationsPane");
      this.applicationsGrid.startup();


    },

    updateUsageReportBtn: function () {
      registry.byId('getUsageReportBtn').set('disabled', false);
      registry.byId('userTypeSelect').set('disabled', true);
      registry.byId('usernameSelect').set('disabled', true);
      registry.byId('serviceNamesSelect').set('disabled', true);
      registry.byId('applicationIdSelect').set('disabled', true);
      registry.byId('serviceTypeSelect').set('disabled', true);

      dom.byId('portalUsersNode').innerHTML = "";
      dom.byId('portalServicesNode').innerHTML = "";

      var usageStore = new Memory({
        idProperty: "username",
        data: []
      });

      this.usageGrid.set("store", usageStore);
      this.orgGrid.set("store", usageStore);
      this.usersGrid.set("store", usageStore);
      this.servicesGrid.set("store", usageStore);

    },

    reportOptionSelected: function (selectedChild) {

      switch (selectedChild.title) {
        case "Organization":
          if(this.orgChart) {
            this.orgChart.resize();
          }
          break;
        case "Users":
          if(this.usersChart) {
            this.usersChart.resize();
          }
          break;
      }


    },

    updateUsageReports: function () {
      var deferred = new Deferred();

      var requestDialog = new Dialog({
        title: "Usage and Credit Report",
        content: lang.replace("Requesting usage and credit report for the<br>'{name}' organization...", this.portalUser.portal),
        closable: false
      });
      requestDialog.show();

      all([
        this.getUsageReport(),
        this.getUsersReports(),
        this.getServicesReports(),
        this.getApplicationReports()
      ]).then(lang.hitch(this, function () {
        requestDialog.hide();
        deferred.resolve();
      }), lang.hitch(this, function (error) {
        requestDialog.hide();
        deferred.reject(error);
      }));

      return deferred.promise;
    },

    /**
     *
     * @param serviceName
     * @param withinOrg
     */
    showPossibleServices: function (serviceName, withinOrg) {

      var contentNode = put('div');
      var resultsNode = put(contentNode, 'div.dijitDialogPaneContentArea', 'Searching...');

      if(!this.searchResultsDlg) {
        this.searchResultsDlg = new Dialog({
          id: "searchResultsDlg",
          title: "Possible ArcGIS.com Items",
          content: contentNode
        });
      } else {
        this.searchResultsDlg.set('content', contentNode);
      }
      this.searchResultsDlg.show();

      var paramTemplate = withinOrg ? 'orgid:{0} AND name:"{1}" AND type:service' : 'name:"{1}" AND type:service';
      var params = {
        q: lang.replace(paramTemplate, [this.portalUser.portal.id, serviceName]),
        num: 100
      };

      this.portalUser.portal.queryItems(params).then(lang.hitch(this, function (response) {

        if(response.results.length > 0) {
          resultsNode.innerHTML = '';
          array.forEach(response.results, lang.hitch(this, function (item) {
            put(resultsNode, 'div.resultNode', {
              innerHTML: lang.replace("{title} ({type})", item),
              onclick: lang.hitch(this, function () {
                //console.log(item);
                var detailsUrlTemplate = (item.owner === this.portalUser.username) ? "{0}//{1}.{2}/home/item.html?id={3}" : "{0}//www.arcgis.com/home/item.html?id={3}";
                var agsDetailsUrl = lang.replace(detailsUrlTemplate, [document.location.protocol, this.portalUser.portal.urlKey, this.portalUser.portal.customBaseUrl, item.id]);
                window.open(agsDetailsUrl);
              })
            });
          }));

        } else {
          resultsNode.innerHTML = lang.replace('No items found that match this criteria:<br><br><b>{q}</b>', params);

          if(withinOrg) {
            var actionNode = put(contentNode, 'div.dijitDialogPaneActionBar');
            var outsideOrgBtn = new Button({
              label: "Search for item outside the Organization",
              onClick: lang.hitch(this, function () {
                this.showPossibleServices(serviceName, false);
              })
            }, domConstruct.create('div', {}, actionNode));
          }
        }

      }));

    },

    /**
     *
     * @param results
     */
    sourceListUpdated: function (results) {

      if(this.isUserTypeFilter) {
        //registry.byId('usernameSelect').set('value', 'none');
        //registry.byId('serviceNamesSelect').set('value', 'none');
        this.isUserTypeFilter = false;
        //this.updateFilterSelectsItems({data: results});
        //this.updateFilterSelects({data: results});
      }

      var counts = {
        store: this.usageGrid.store.data.length,
        display: results.total
      };
      dom.byId('searchResultsCount').innerHTML = lang.replace('{display} of {store}', counts);

      var totals = {
        num: 0,
        bw: 0,
        stg: 0,
        credits: 0
      };
      array.forEach(results, function (result) {
        for (var field in result) {
          if(result.hasOwnProperty(field) && (totals.hasOwnProperty(field))) {
            array.forEach(result[field], function (values) {
              totals[field] += parseFloat(values[1]);
            });
          }
        }
      });
      //console.log(totals);

      dom.byId('totalRequests').innerHTML = this.formatNumericValue(totals.num, 0);
      dom.byId('totalBandwidth').innerHTML = this.bytesToSize(totals.bw);
      dom.byId('totalStorage').innerHTML = this.bytesToSize(totals.stg);
      dom.byId('totalCredits').innerHTML = this.formatNumericValue(totals.credits, 2);
    },

    /**
     *
     * @param usageReport
     */
    /*updateFilterSelectsItems: function (usageReport) {

     var usernames = [];
     var serviceNames = [];
     array.forEach(usageReport.data, function (usageDetails) {
     if(array.indexOf(usernames, usageDetails.username) === -1) {
     usernames.push(usageDetails.username);
     }
     if(array.indexOf(serviceNames, usageDetails.name) === -1) {
     serviceNames.push(usageDetails.name);
     }
     });

     var usernameOptions = registry.byId('usernameSelect').options;
     array.forEach(usernameOptions, function (option) {
     if(option.value !== 'none') {
     option.disabled = (array.indexOf(usernames, option.value) === -1);
     }
     });
     registry.byId('usernameSelect').startup();

     var serviceNamesOptions = registry.byId('serviceNamesSelect').options;
     array.forEach(serviceNamesOptions, function (option) {
     if(option.value !== 'none') {
     option.disabled = (array.indexOf(serviceNames, option.value) === -1);
     }
     });
     registry.byId('serviceNamesSelect').startup();

     },*/


    /**
     *
     */
    initServiceTypeSelect: function () {
      var serviceTypeData = [
        {id: "none", label: '<span class="noneLabel">...no service type filter...</span>'}
      ];
      for (var serviceType in this.variablesByType) {
        if(this.variablesByType.hasOwnProperty(serviceType)) {
          var serviceTypeInfo = {
            id: serviceType,
            label: lang.replace("<b>{0}</b>: {1}", [serviceType, this.variablesByType[serviceType].desc])
          };
          serviceTypeData.push(serviceTypeInfo);
        }
      }

      var serviceTypeStore = new ObjectStore({
        objectStore: new Memory({
          data: serviceTypeData
        })
      });
      registry.byId('serviceTypeSelect').setStore(serviceTypeStore);
    },

    /**
     *
     * @param usageReport
     */
    updateFilterSelects: function (usageReport) {

      var usernames = [];
      var usernamesData = [
        {id: "none", label: '<span class="noneLabel">...no username filter...</span>'}
      ];

      var serviceNames = [];
      var serviceNamesData = [
        {id: "none", label: '<span class="noneLabel">...no service name filter...</span>'}
      ];

      var applicationIds = [];
      var applicationIdsData = [
        {id: "none", label: '<span class="noneLabel">...no application id filter...</span>'}
      ];


      array.forEach(usageReport.data, function (usageDetails) {
        if(array.indexOf(usernames, usageDetails.username) === -1) {
          usernames.push(usageDetails.username);
          usernamesData.push({
            id: usageDetails.username,
            label: usageDetails.username
          });
        }
        if(array.indexOf(serviceNames, usageDetails.name) === -1) {
          serviceNames.push(usageDetails.name);
          serviceNamesData.push({
            id: usageDetails.name,
            label: usageDetails.name
          });
        }
        if(array.indexOf(applicationIds, usageDetails.appId) === -1) {
          applicationIds.push(usageDetails.appId);
          applicationIdsData.push({
            id: usageDetails.appId,
            label: usageDetails.appId
          });
        }
      });

      var usernamesStore = new ObjectStore({
        objectStore: new Memory({
          data: usernamesData
        })
      });
      registry.byId('usernameSelect').setStore(usernamesStore);
      registry.byId('usernameSelect').set('disabled', false);

      var serviceNamesStore = new ObjectStore({
        objectStore: new Memory({
          data: serviceNamesData
        })
      });
      registry.byId('serviceNamesSelect').setStore(serviceNamesStore);
      registry.byId('serviceNamesSelect').set('disabled', false);


      var applicationIdsStore = new ObjectStore({
        objectStore: new Memory({
          data: applicationIdsData
        })
      });
      registry.byId('applicationIdSelect').setStore(applicationIdsStore);
      registry.byId('applicationIdSelect').set('disabled', false);

    },

    /**
     *
     */
    filterResults: function (isUserTypeFilter) {

      this.isUserTypeFilter = isUserTypeFilter;

      var filterQuery = {};

      var userTypeFilter = registry.byId('userTypeSelect').get('value');
      if((userTypeFilter !== '') && (userTypeFilter !== 'none')) {
        filterQuery.userType = userTypeFilter;
      }

      var usernameFilter = registry.byId('usernameSelect').get('value');
      if((usernameFilter !== '') && (usernameFilter !== 'none')) {
        filterQuery.username = usernameFilter;
      }

      var serviceNamesFilter = registry.byId('serviceNamesSelect').get('value');
      if((serviceNamesFilter !== '') && (serviceNamesFilter !== 'none')) {
        filterQuery.name = serviceNamesFilter;
      }

      var applicationIdFilter = registry.byId('applicationIdSelect').get('value');
      if((applicationIdFilter !== '') && (applicationIdFilter !== 'none')) {
        filterQuery.appId = applicationIdFilter;
      }

      var serviceFilter = registry.byId('serviceTypeSelect').get('value');
      if((serviceFilter !== '') && (serviceFilter !== 'none')) {
        var typeParts = serviceFilter.split('.');
        filterQuery.etype = typeParts[0];
        filterQuery.stype = typeParts[1];
      }

      this.usageGrid.set('query', filterQuery);
    },


    /**
     *
     */
    getUsageReport: function () {
      // http://mediawikidev.esri.com/index.php/ArcGIS.com/Credit_and_Reporting_APIs

      this.usageGrid.set('query', {});

      registry.byId('getUsageReportBtn').set('disabled', true);
      registry.byId('userTypeSelect').set('disabled', false);
      registry.byId('usernameSelect').set('disabled', false);
      registry.byId('serviceNamesSelect').set('disabled', false);
      registry.byId('applicationIdSelect').set('disabled', false);
      registry.byId('serviceTypeSelect').set('disabled', true);
      registry.byId('userTypeSelect').set('value', 'none');
      registry.byId('usernameSelect').set('value', 'none');
      registry.byId('serviceNamesSelect').set('value', 'none');
      registry.byId('applicationIdSelect').set('value', 'none');
      registry.byId('serviceTypeSelect').set('value', 'none');


      return this._getUsageReport("etype,stype,name,username,appid", {}, "bw,num,stg,cpu,credits").then(lang.hitch(this, function (usageReport) {
        //console.log(usageReport);

        var dataStartTime = new Date(usageReport.startTime);
        var dataEndTime = new Date(usageReport.endTime);
        var dataStartDate = locale.format(dataStartTime, {selector: "date", formatLength: "short"});
        var dataEndDate = locale.format(dataEndTime, {selector: "date", formatLength: "short"});
        dom.byId('dataDateRange').innerHTML = lang.replace("{0} to {1}", [dataStartDate, dataEndDate]);

        this.serviceNames = [];
        this.appIds = []

        array.forEach(usageReport.data, lang.hitch(this, function (usageDetails) {

          var serviceType = lang.replace("{etype}.{stype}", usageDetails);
          usageDetails.variable = this.variablesByType[serviceType];

          // ASSIGN USERNAME AND USERTYPE //
          if(!usageDetails.username) {
            if(!usageDetails.name) {
              usageDetails.username = lang.replace("{portal.name}", this.portalUser);
              usageDetails.userType = "theOrg";
            } else {
              usageDetails.username = "Anonymous";
              usageDetails.userType = "anonymousUser";
            }
          } else {
            usageDetails.userType = this.isOrganizationUser(usageDetails.username) ? "orgUser" : "nonOrgUser";
          }

          // BUILD LIST OF UNIQUE SERVICE NAMES //
          if(array.indexOf(this.serviceNames, usageDetails.name) === -1) {
            if(usageDetails.name) {
              this.serviceNames.push(usageDetails.name);
            }
          }
          // BUILD LIST OF UNIQUE APP IDS //
          if(array.indexOf(this.appIds, usageDetails.appId) === -1) {
            if(usageDetails.appId) {
              this.appIds.push(usageDetails.appId);
            }
          }

        }));

        this.usageStore = new Memory({
          idProperty: "username",
          data: usageReport.data
        });
        this.usageGrid.set("store", this.usageStore);
        this.orgGrid.set("store", this.usageStore);

        this.updateOrgCharts(this.usageGrid);

        this.updateFilterSelects(usageReport);
        registry.byId('serviceTypeSelect').set('disabled', false);

        this.displayUserStats();
        this.displayServiceStats();
        this.displayApplicationsStats();
      }));

    },


    getUsersReports: function () {

      return this._getUsageReport("username", {}, "bw,num,stg,cpu,credits").then(lang.hitch(this, function (usageReport) {

        array.forEach(usageReport.data, lang.hitch(this, function (usageDetails) {
          if(!usageDetails.username) {
            usageDetails.username = "Anonymous";
            usageDetails.userType = "anonymousUser";
          } else {
            usageDetails.userType = this.isOrganizationUser(usageDetails.username) ? "orgUser" : "nonOrgUser";
          }
        }));

        var usageStore = new Memory({
          idProperty: "username",
          data: usageReport.data
        });

        if(this.usersGrid) {
          this.usersGrid.set("store", usageStore);
        }

        this.updateUsersCharts();

      }));

    },

    getServicesReports: function () {

      return this._getUsageReport("name,hostorgid", {}, "bw,num,stg,credits").then(lang.hitch(this, function (usageReport) {

        var data = array.filter(usageReport.data, lang.hitch(this, function (usageDetails) {
          return (usageDetails.hasOwnProperty('name') && (usageDetails.name != null) && (usageDetails.name != ""));
        }));

        var usageStore = new Memory({
          idProperty: "name",
          data: data
        });

        if(this.servicesGrid) {
          this.servicesGrid.set("store", usageStore);
        }

      }));

    },

    getApplicationReports: function () {

      return this._getUsageReport("appid,apporgid", {}, "bw,num,stg,credits").then(lang.hitch(this, function (usageReport) {

        var data = array.filter(usageReport.data, lang.hitch(this, function (usageDetails) {
          return (usageDetails.hasOwnProperty('appId') && (usageDetails.appId != null) && (usageDetails.appId != ""));
        }));

        var usageStore = new Memory({
          idProperty: "appId",
          data: data
        });

        if(this.applicationsGrid) {
          this.applicationsGrid.set("store", usageStore);
        }

      }));

    },

    /**
     *
     * @param groupBy
     * @param filters
     * @param variables
     * @returns {*}
     * @private
     */
    _getUsageReport: function (groupBy, filters, variables) {
      var deferred = new Deferred();

      var startDate = registry.byId('startDateInput').get('value');
      var endDate = registry.byId('endDateInput').get('value');
      var periodInput = registry.byId('periodInput').get('value');
      var periodSelect = registry.byId('periodSelect').get('value');

      var dateRange = {
        startTime: startDate.valueOf(),
        endTime: endDate.valueOf(),
        period: periodInput + periodSelect
      };

      var parameters = {
        groupby: groupBy,
        vars: variables
      };

      esriRequest({
        url: lang.replace("{portal.portalUrl}/portals/{portal.id}/usage", this.portalUser),
        content: lang.mixin({f: "json"}, dateRange, parameters, filters || {})
      }).then(lang.hitch(this, function (usageReport) {
        //console.log(usageReport);
        deferred.resolve(usageReport);
      }), deferred.reject);

      return deferred.promise;
    },

    /**
     *
     */
    displayUserStats: function () {
      var portalUsersNode = dom.byId('portalUsersNode');
      portalUsersNode.innerHTML = "";

      var creditsPerUser = array.map(this.portalUsers, lang.hitch(this, function (portalUser) {
        return {
          username: portalUser.username,
          credits: this.calcCredits({username: portalUser.username})
        }
      }));

      creditsPerUser.sort(lang.hitch(this, function (item1, item2) {
        return item2.credits - item1.credits;
      }));

      array.forEach(creditsPerUser, lang.hitch(this, function (creditsInfo) {
        if(creditsInfo.credits > 0) {
          var portalUserNode = put(portalUsersNode, 'div.portalUserNode', {
            onclick: lang.hitch(this, function () {
              registry.byId('userTypeSelect').set('value', 'none');
              registry.byId('serviceNamesSelect').set('value', 'none');
              registry.byId('applicationIdSelect').set('value', 'none');
              registry.byId('serviceTypeSelect').set('value', 'none');
              registry.byId('usernameSelect').set('value', creditsInfo.username);
            })
          });
          put(portalUserNode, 'span.usernameNode', creditsInfo.username);
          put(portalUserNode, 'span.userCreditsNode', this.formatNumericValue(creditsInfo.credits, 6));
        }
      }));

    },

    /**
     *
     */
    displayServiceStats: function () {
      var portalServicesNode = dom.byId('portalServicesNode');
      portalServicesNode.innerHTML = "";

      var creditsPerService = array.map(this.serviceNames, lang.hitch(this, function (serviceName) {
        return {
          name: serviceName,
          credits: this.calcCredits({name: serviceName})
        }
      }));

      creditsPerService.sort(lang.hitch(this, function (item1, item2) {
        return item2.credits - item1.credits;
      }));

      array.forEach(creditsPerService, lang.hitch(this, function (creditsInfo) {
        if(creditsInfo.credits > 0) {
          var portalServiceNode = put(portalServicesNode, 'div.portalServiceNode', {
            onclick: lang.hitch(this, function () {
              registry.byId('userTypeSelect').set('value', 'none');
              registry.byId('usernameSelect').set('value', 'none');
              registry.byId('applicationIdSelect').set('value', 'none');
              registry.byId('serviceTypeSelect').set('value', 'none');
              registry.byId('serviceNamesSelect').set('value', creditsInfo.name);
            })
          });
          put(portalServiceNode, 'span.serviceNameNode', creditsInfo.name);
          put(portalServiceNode, 'span.serviceCreditsNode', this.formatNumericValue(creditsInfo.credits, 6));
        }
      }));

    },

    displayApplicationsStats: function () {
      var portalApplicationsNode = dom.byId('portalApplicationsNode');
      portalApplicationsNode.innerHTML = "";

      var creditsPerApp = array.map(this.appIds, lang.hitch(this, function (appId) {
        return {
          name: appId,
          credits: this.calcCredits({appId: appId})
        }
      }));

      creditsPerApp.sort(lang.hitch(this, function (item1, item2) {
        return item2.credits - item1.credits;
      }));

      array.forEach(creditsPerApp, lang.hitch(this, function (creditsInfo) {
        if(creditsInfo.credits > 0) {
          var portalApplicationNode = put(portalApplicationsNode, 'div.portalApplicationsNode', {
            onclick: lang.hitch(this, function () {
              registry.byId('userTypeSelect').set('value', 'none');
              registry.byId('usernameSelect').set('value', 'none');
              registry.byId('serviceTypeSelect').set('value', 'none');
              registry.byId('serviceNamesSelect').set('value', 'none');
              registry.byId('applicationIdSelect').set('value', creditsInfo.appId);
            })
          });
          put(portalApplicationNode, 'span.appIdNode', creditsInfo.name);
          put(portalApplicationNode, 'span.applicationCreditsNode', this.formatNumericValue(creditsInfo.credits, 6));
        }
      }));

    },


    /**
     *
     * @param query
     * @returns {number}
     */
    calcCredits: function (query) {
      var results = this.usageGrid.store.query(query);
      var totalCredits = 0.0;
      array.forEach(results, lang.hitch(this, function (result) {
        totalCredits += this.calcTotal(result.credits);
      }));
      return totalCredits;
    },

    /**
     *
     * @param values
     * @returns {number}
     */
    calcTotal: function (values) {
      var totalValue = 0;
      array.forEach(values, lang.hitch(this, function (val) {
        totalValue += parseFloat(val[1]);
      }));
      return totalValue;
    },

    /*calcTotal2: function (attr, item) {
     var totalValue = 0;
     array.forEach(item[attr], lang.hitch(this, function (val) {
     totalValue += parseFloat(val[1]);
     }));
     return totalValue;
     },*/


    /**
     *
     * @param variableName
     * @param places
     * @param object
     * @param value
     * @param node
     * @param options
     * @returns {*}
     */
    cellRenderer: function (variableName, places, object, value, node, options) {

      var isSize = ((variableName === 'bw') || (variableName === 'stg'));
      var variables = object.variable.vars || [];
      var isCredits = (variableName === 'credits');
      if(isCredits || array.indexOf(variables, variableName) > -1) {
        var table = put('table', {width: "100%"});

        array.forEach(value, lang.hitch(this, function (val) {
          var dateValue = parseInt(val[0]);
          var numberValue = parseFloat(val[1]);

          var row = put(table, 'tr');
          put(row, 'td.dateCell', {
            innerHTML: locale.format(new Date(dateValue), {selector: "date", formatLength: "short"})
          });
          put(row, 'td', {
            align: 'right',
            innerHTML: isSize ? this.bytesToSize(numberValue) : this.formatNumericValue(numberValue, places)
          });
        }));

        return table;
      } else {
        return put('div', "");
      }
    },

    /**
     *
     * @param variableName
     * @param places
     * @param object
     * @param value
     * @param node
     * @param options
     * @returns {*}
     */
    totalsCellRenderer: function (variableName, places, object, value, node, options) {
      var isSize = ((variableName === 'bw') || (variableName === 'stg'));
      var totalValue = this.calcTotal(value);
      return put("div.userValue", isSize ? this.bytesToSize(totalValue) : this.formatNumericValue(totalValue, places))
    },


    //totalsCellRenderer2: function (variableName, places, object, value, node, options) {
    //  var isSize = ((variableName === 'bw') || (variableName === 'stg'));
    //  console.log("totalsCellRenderer: ", variableName, value);
    //  var totalValue = value; // this.calcTotal(value);
    //  return put("div.userValue", isSize ? this.bytesToSize(totalValue) : this.formatNumericValue(totalValue, places))
    //},


    /**
     *
     * @param value
     * @param places
     * @returns {*}
     */
    formatNumericValue: function (value, places) {
      if(value > 0) {
        return number.format(value, {places: places})
      } else {
        return "";
      }
    },

    /**
     *
     * @param bytes
     * @returns {string}
     */
    bytesToSize: function (bytes) {
      // http://stackoverflow.com/questions/15900485/correctly-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
      // http://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable
      var sizes = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      if(bytes == 0) return '';//'0.00 bytes';
      var sizeIndex = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
      return (bytes / Math.pow(1024, sizeIndex)).toFixed((sizeIndex === 0) ? 0 : 2) + ' ' + sizes[sizeIndex];
    },


    updateOrgCharts: function () {

      require([
        "dojox/charting/Chart",
        "dojox/charting/plot2d/Pie",
        "dojox/charting/action2d/Highlight",
        "dojox/charting/action2d/MoveSlice",
        "dojox/charting/action2d/Tooltip",
        "dojox/charting/themes/MiamiNice"
      ], lang.hitch(this, function (Chart, Pie, Highlight, MoveSlice, Tooltip, theTheme) {


        var orgData = this.orgGrid.store.query({userType: "theOrg"});

        var creditsData = array.map(orgData, lang.hitch(this, function (orgItem) {
          var totalCredits = this.calcTotal(orgItem.credits);
          return {
            y: totalCredits,
            text: orgItem.variable.desc,
            tooltip: number.format(totalCredits, {places: 2}) + " credits"
          };
        }));

        if(!this.orgChart) {

          this.orgChart = new Chart("orgChartNode");
          this.orgChart.setTheme(theTheme);
          this.orgChart.addPlot("default", {
            type: Pie,
            font: "normal normal 11pt Tahoma",
            fontColor: "black",
            labelOffset: -100,
            radius: 100
          });

          this.orgChart.addSeries("Credits", creditsData);

          /*
           var store = new Memory({
           idProperty: "type",
           data: grid.store.query({userType: "theOrg"})
           });
           chartTwo.addSeries("Credits", new StoreSeries(store, {type: "*"}, "credits-total"));
           */

          var anim_a = new MoveSlice(this.orgChart, "default");
          var anim_b = new Highlight(this.orgChart, "default");
          var anim_c = new Tooltip(this.orgChart, "default");
          /*var anim_c = new Tooltip(chartTwo, "default", {
           text: lang.hitch(this, function (o) {
           //console.log(o);
           var data = o.run.source.objects[o.x];
           var serviceType = lang.replace("{etype}.{stype}", data);
           var variable = this.variablesByType[serviceType];

           return variable + ": " + number.format(o.y, {places: 2}) + " credits";
           })
           });*/
          this.orgChart.render();

        } else {
          this.orgChart.updateSeries("Credits", creditsData);
          this.orgChart.render();
        }

      }));


    },

    updateUsersCharts: function () {

      require([
        "dojox/charting/Chart",
        "dojox/charting/plot2d/Pie",
        "dojox/charting/action2d/Highlight",
        "dojox/charting/action2d/MoveSlice",
        "dojox/charting/action2d/Tooltip",
        "dojox/charting/themes/MiamiNice"
      ], lang.hitch(this, function (Chart, Pie, Highlight, MoveSlice, Tooltip, theTheme) {

        var orgUsersData = this.usersGrid.store.query({userType: "orgUser"});

        var creditsData = array.map(orgUsersData, lang.hitch(this, function (orgItem) {
          orgItem.totalCredits = this.calcTotal(orgItem.credits);
          this.usersGrid.store.put(orgItem);
          return {
            y: orgItem.totalCredits,
            text: orgItem.username,
            tooltip: number.format(orgItem.totalCredits, {places: 2}) + " credits"
          };
        }));

        if(!this.usersChart) {

          this.usersChart = new Chart("usersChartNode");
          this.usersChart.setTheme(theTheme);
          this.usersChart.addPlot("default", {
            type: Pie,
            font: "normal normal 11pt Tahoma",
            fontColor: "black",
            labelWiring: "#ccc",
            radius: 100,
            labelStyle: "columns",
            htmlLabels: true
          });

          this.usersChart.addSeries("Credits", creditsData);

          var anim_a = new MoveSlice(this.usersChart, "default");
          var anim_b = new Highlight(this.usersChart, "default");
          var anim_c = new Tooltip(this.usersChart, "default");
          this.usersChart.render();

        } else {
          this.usersChart.updateSeries("Credits", creditsData);
          this.usersChart.render();
        }

      }));


    }

  });
});

